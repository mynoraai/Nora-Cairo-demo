#[starknet::contract]
mod SwipeMatch {
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        profile_commitments: Map<ContractAddress, felt252>,
        likes: Map<(ContractAddress, ContractAddress), u8>,
        matches: Map<(ContractAddress, ContractAddress), u8>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ProfileSet: ProfileSet,
        LikeSent: LikeSent,
        MatchMade: MatchMade,
    }

    #[derive(Drop, starknet::Event)]
    struct ProfileSet {
        user: ContractAddress,
        profile_commitment: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct LikeSent {
        liker: ContractAddress,
        likee: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct MatchMade {
        user_a: ContractAddress,
        user_b: ContractAddress,
    }

    fn set_profile_internal(
        ref self: ContractState, caller: ContractAddress, profile_commitment: felt252,
    ) {
        assert(profile_commitment != 0_felt252, 'Commitment required');
        self.profile_commitments.write(caller, profile_commitment);
        self.emit(Event::ProfileSet(ProfileSet { user: caller, profile_commitment }));
    }

    fn like_profile_internal(
        ref self: ContractState, caller: ContractAddress, target: ContractAddress,
    ) {
        assert(caller != target, 'Cannot like self');

        let caller_profile = self.profile_commitments.read(caller);
        assert(caller_profile != 0, 'Profile missing');

        let target_profile = self.profile_commitments.read(target);
        assert(target_profile != 0, 'Target missing');

        let already_liked = self.likes.read((caller, target));
        assert(already_liked == 0_u8, 'Already liked');

        self.likes.write((caller, target), 1_u8);
        self.emit(Event::LikeSent(LikeSent { liker: caller, likee: target }));

        let reciprocal_like = self.likes.read((target, caller));
        if reciprocal_like == 1_u8 {
            let match_recorded = self.matches.read((caller, target));
            if match_recorded == 0_u8 {
                self.matches.write((caller, target), 1_u8);
                self.matches.write((target, caller), 1_u8);
                self.emit(Event::MatchMade(MatchMade { user_a: caller, user_b: target }));
            }
        }
    }

    #[external(v0)]
    pub fn set_profile(ref self: ContractState, profile_commitment: felt252) {
        let caller = get_caller_address();
        set_profile_internal(ref self, caller, profile_commitment);
    }

    #[external(v0)]
    pub fn get_profile_commitment(self: @ContractState, user: ContractAddress) -> felt252 {
        self.profile_commitments.read(user)
    }

    #[external(v0)]
    pub fn like_profile(ref self: ContractState, target: ContractAddress) {
        let caller = get_caller_address();
        like_profile_internal(ref self, caller, target);
    }

    #[external(v0)]
    pub fn has_liked(self: @ContractState, user: ContractAddress, target: ContractAddress) -> u8 {
        self.likes.read((user, target))
    }

    #[external(v0)]
    pub fn has_match(self: @ContractState, user: ContractAddress, target: ContractAddress) -> u8 {
        self.matches.read((user, target))
    }

    #[cfg(test)]
    pub(crate) fn set_profile_for_tests(
        ref self: ContractState, caller: ContractAddress, profile_commitment: felt252,
    ) {
        set_profile_internal(ref self, caller, profile_commitment);
    }

    #[cfg(test)]
    pub(crate) fn like_profile_for_tests(
        ref self: ContractState, caller: ContractAddress, target: ContractAddress,
    ) {
        like_profile_internal(ref self, caller, target);
    }

    #[cfg(test)]
    mod tests {
        use core::traits::TryInto;
        use starknet::ContractAddress;
        use super::{like_profile_for_tests, set_profile_for_tests};

        fn users() -> (ContractAddress, ContractAddress, ContractAddress) {
            let alice: ContractAddress = 'alice'.try_into().unwrap();
            let bob: ContractAddress = 'bob'.try_into().unwrap();
            let carol: ContractAddress = 'carol'.try_into().unwrap();
            (alice, bob, carol)
        }

        #[test]
        #[available_gas(2000000)]
        fn test_set_profile() {
            let (alice, _, _) = users();
            let mut state = super::contract_state_for_testing();

            set_profile_for_tests(ref state, alice, 111_felt252);

            let stored: felt252 = super::get_profile_commitment(@state, alice);
            assert(stored == 111_felt252, 'Profile not stored');
        }

        #[test]
        #[available_gas(2000000)]
        #[should_panic(expected: ('Cannot like self',))]
        fn test_like_self_panics() {
            let (alice, _, _) = users();
            let mut state = super::contract_state_for_testing();

            set_profile_for_tests(ref state, alice, 111_felt252);

            like_profile_for_tests(ref state, alice, alice);
        }

        #[test]
        #[available_gas(2000000)]
        #[should_panic(expected: ('Profile missing',))]
        fn test_like_without_profile_panics() {
            let (alice, bob, _) = users();
            let mut state = super::contract_state_for_testing();

            set_profile_for_tests(ref state, bob, 222_felt252);

            like_profile_for_tests(ref state, alice, bob);
        }

        #[test]
        #[available_gas(2000000)]
        fn test_like_records_state() {
            let (alice, bob, _) = users();
            let mut state = super::contract_state_for_testing();

            set_profile_for_tests(ref state, alice, 111_felt252);
            set_profile_for_tests(ref state, bob, 222_felt252);

            like_profile_for_tests(ref state, alice, bob);

            let liked: u8 = super::has_liked(@state, alice, bob);
            assert(liked == 1_u8, 'Like not recorded');
            let match_flag: u8 = super::has_match(@state, alice, bob);
            assert(match_flag == 0_u8, 'Match should not exist yet');
        }

        #[test]
        #[available_gas(2000000)]
        fn test_mutual_like_creates_match() {
            let (alice, bob, _) = users();
            let mut state = super::contract_state_for_testing();

            set_profile_for_tests(ref state, alice, 111_felt252);
            set_profile_for_tests(ref state, bob, 222_felt252);

            like_profile_for_tests(ref state, alice, bob);
            like_profile_for_tests(ref state, bob, alice);

            let alice_match: u8 = super::has_match(@state, alice, bob);
            let bob_match: u8 = super::has_match(@state, bob, alice);
            assert(alice_match == 1_u8, 'Match missing for Alice');
            assert(bob_match == 1_u8, 'Match missing for Bob');
        }

        #[test]
        #[available_gas(2000000)]
        #[should_panic(expected: ('Already liked',))]
        fn test_duplicate_like_panics() {
            let (alice, bob, carol) = users();
            let mut state = super::contract_state_for_testing();

            set_profile_for_tests(ref state, alice, 111_felt252);
            set_profile_for_tests(ref state, bob, 222_felt252);
            set_profile_for_tests(ref state, carol, 333_felt252);

            like_profile_for_tests(ref state, alice, bob);
            like_profile_for_tests(ref state, alice, bob);
        }
    }
}
