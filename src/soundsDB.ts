export interface ShopSound {
  id: string;
  name: string;
  price: number;
  description: string;
  tier: 'Classic' | 'Silver' | 'Gold' | 'Diamond' | 'Platinum';
  serialNumber?: string;
}

export const SHOP_SOUNDS: ShopSound[] = [
  // Classic - 100 Coins (Pets and Farm animals)
  { id: 'sound_classic_1', name: 'Dog Bark', price: 100, description: 'A friendly dog\'s bark.', tier: 'Classic' },
  { id: 'sound_classic_2', name: 'Cat Meow', price: 100, description: 'A soft kitty meow.', tier: 'Classic' },
  { id: 'sound_classic_3', name: 'Rooster Crow', price: 100, description: 'Wake up the farm!', tier: 'Classic' },
  { id: 'sound_classic_4', name: 'Cow Moo', price: 100, description: 'A classic farm sound.', tier: 'Classic' },
  { id: 'sound_classic_5', name: 'Pig Oink', price: 100, description: 'Happy pig noises.', tier: 'Classic' },
  { id: 'sound_classic_6', name: 'Horse Neigh', price: 100, description: 'A gentle stallion.', tier: 'Classic' },
  { id: 'sound_classic_7', name: 'Sheep Baa', price: 100, description: 'Wooly sheep bleat.', tier: 'Classic' },
  { id: 'sound_classic_8', name: 'Duck Quack', price: 100, description: 'A classic quack.', tier: 'Classic' },
  { id: 'sound_classic_9', name: 'Turkey Gobble', price: 100, description: 'Festive bird sounds.', tier: 'Classic' },
  { id: 'sound_classic_10', name: 'Goat Bleat', price: 100, description: 'A noisy farm goat.', tier: 'Classic' },
  { id: 'sound_classic_11', name: 'Chicken Cluck', price: 100, description: 'Pecking for seeds.', tier: 'Classic' },
  { id: 'sound_classic_12', name: 'Mouse Squeak', price: 100, description: 'Tiny critter squeak.', tier: 'Classic' },
  { id: 'sound_classic_13', name: 'Parakeet Chirp', price: 100, description: 'A pet bird chirping.', tier: 'Classic' },
  { id: 'sound_classic_14', name: 'Puppy Whimper', price: 100, description: 'A cute little pup.', tier: 'Classic' },
  { id: 'sound_classic_15', name: 'Donkey Bray', price: 100, description: 'Hee-haw!', tier: 'Classic' },
  
  // Stone Placement / Zen Sounds - 300 Coins
  { id: 'sound_classic_16', name: 'Bamboo Click', price: 300, description: 'A sharp, resonant bamboo tap.', tier: 'Classic' },
  { id: 'sound_classic_17', name: 'Jade Stone', price: 300, description: 'The solid, heavy thud of jade.', tier: 'Classic' },
  { id: 'sound_classic_18', name: 'Ceramic Tap', price: 300, description: 'A crisp ceramic clink.', tier: 'Classic' },
  { id: 'sound_classic_19', name: 'Crystal Drop', price: 300, description: 'A light, high-pitched crystal ping.', tier: 'Classic' },
  { id: 'sound_classic_20', name: 'Water Drop', price: 300, description: 'A gentle ripple of water.', tier: 'Classic' },
  { id: 'sound_silver_16', name: 'Wood Knock', price: 300, description: 'A deep thud on hollow wood.', tier: 'Silver', serialNumber: 'SND-SIL-1015' },
  { id: 'sound_silver_17', name: 'Steel Clink', price: 300, description: 'A metallic clang of steel.', tier: 'Silver', serialNumber: 'SND-SIL-1016' },
  { id: 'sound_silver_18', name: 'Hollow Bamboo', price: 300, description: 'A hollow, echoing bamboo knock.', tier: 'Silver', serialNumber: 'SND-SIL-1017' },
  { id: 'sound_silver_19', name: 'Resonant Stone', price: 300, description: 'A vibrating, resonant stone placement.', tier: 'Silver', serialNumber: 'SND-SIL-1018' },
  { id: 'sound_silver_20', name: 'Sharp Glass', price: 300, description: 'A piercing glass tap.', tier: 'Silver', serialNumber: 'SND-SIL-1019' },

  // Silver - 500 Coins (Forest and Wild land animals)
  { id: 'sound_silver_1', name: 'Wolf Howl', price: 500, description: 'Howl at the moon.', tier: 'Silver', serialNumber: 'SND-SIL-1000' },
  { id: 'sound_silver_2', name: 'Bear Roar', price: 500, description: 'A menacing bear roar.', tier: 'Silver', serialNumber: 'SND-SIL-1001' },
  { id: 'sound_silver_3', name: 'Snake Hiss', price: 500, description: 'Ssssss...', tier: 'Silver', serialNumber: 'SND-SIL-1002' },
  { id: 'sound_silver_4', name: 'Monkey Chatter', price: 500, description: 'Jungle monkey noises.', tier: 'Silver', serialNumber: 'SND-SIL-1003' },
  { id: 'sound_silver_5', name: 'Frog Croak', price: 500, description: 'Ribbit ribbit.', tier: 'Silver', serialNumber: 'SND-SIL-1004' },
  { id: 'sound_silver_6', name: 'Coyote Bark', price: 500, description: 'Desert predator.', tier: 'Silver', serialNumber: 'SND-SIL-1005' },
  { id: 'sound_silver_7', name: 'Elk Bugle', price: 500, description: 'A loud forest call.', tier: 'Silver', serialNumber: 'SND-SIL-1006' },
  { id: 'sound_silver_8', name: 'Wild Boar Snort', price: 500, description: 'Aggressive pig sounds.', tier: 'Silver', serialNumber: 'SND-SIL-1007' },
  { id: 'sound_silver_9', name: 'Raccoon Chitter', price: 500, description: 'A clever trash panda.', tier: 'Silver', serialNumber: 'SND-SIL-1008' },
  { id: 'sound_silver_10', name: 'Squirrel Squeak', price: 500, description: 'Energetic tree dweller.', tier: 'Silver', serialNumber: 'SND-SIL-1009' },
  { id: 'sound_silver_11', name: 'Bobcat Snarl', price: 500, description: 'Fierce wildcat.', tier: 'Silver', serialNumber: 'SND-SIL-1010' },
  { id: 'sound_silver_12', name: 'Moose Call', price: 500, description: 'Large antlered beast.', tier: 'Silver', serialNumber: 'SND-SIL-1011' },
  { id: 'sound_silver_13', name: 'Toad Creak', price: 500, description: 'A deep swamp croak.', tier: 'Silver', serialNumber: 'SND-SIL-1012' },
  { id: 'sound_silver_14', name: 'Hyena Laugh', price: 500, description: 'A wild cackle.', tier: 'Silver', serialNumber: 'SND-SIL-1013' },
  { id: 'sound_silver_15', name: 'Chimpanzee Hoot', price: 500, description: 'Excited ape sounds.', tier: 'Silver', serialNumber: 'SND-SIL-1014' },

  // Gold - 1000 Coins (Birds and Flying animals)
  { id: 'sound_gold_1', name: 'Eagle Screech', price: 1000, description: 'A majestic eagle cry.', tier: 'Gold', serialNumber: 'SND-GOL-1015' },
  { id: 'sound_gold_2', name: 'Owl Hoot', price: 1000, description: 'Whoo whoo!', tier: 'Gold', serialNumber: 'SND-GOL-1016' },
  { id: 'sound_gold_3', name: 'Hawk Cry', price: 1000, description: 'A soaring hawk.', tier: 'Gold', serialNumber: 'SND-GOL-1017' },
  { id: 'sound_gold_4', name: 'Parrot Squawk', price: 1000, description: 'Polly wants a cracker.', tier: 'Gold', serialNumber: 'SND-GOL-1018' },
  { id: 'sound_gold_5', name: 'Bat Shriek', price: 1000, description: 'Echolocation sounds.', tier: 'Gold', serialNumber: 'SND-GOL-1019' },
  { id: 'sound_gold_6', name: 'Crow Caw', price: 1000, description: 'A dark raven\'s call.', tier: 'Gold' },
  { id: 'sound_gold_7', name: 'Pigeon Coo', price: 1000, description: 'City bird noises.', tier: 'Gold', serialNumber: 'SND-GOL-1020' },
  { id: 'sound_gold_8', name: 'Woodpecker Tap', price: 1000, description: 'Knocking on wood.', tier: 'Gold', serialNumber: 'SND-GOL-1021' },
  { id: 'sound_gold_9', name: 'Swan Trumpet', price: 1000, description: 'A graceful water bird.', tier: 'Gold', serialNumber: 'SND-GOL-1022' },
  { id: 'sound_gold_10', name: 'Peacock Call', price: 1000, description: 'A loud ornamental bird.', tier: 'Gold', serialNumber: 'SND-GOL-1023' },
  { id: 'sound_gold_11', name: 'Hummingbird Buzz', price: 1000, description: 'Rapid wing flaps.', tier: 'Gold', serialNumber: 'SND-GOL-1024' },
  { id: 'sound_gold_12', name: 'Vulture Hiss', price: 1000, description: 'Desert scavenger.', tier: 'Gold', serialNumber: 'SND-GOL-1025' },
  { id: 'sound_gold_13', name: 'Crane Call', price: 1000, description: 'Tall elegant bird.', tier: 'Gold', serialNumber: 'SND-GOL-1026' },
  { id: 'sound_gold_14', name: 'Canary Song', price: 1000, description: 'Beautiful singing bird.', tier: 'Gold', serialNumber: 'SND-GOL-1027' },
  { id: 'sound_gold_15', name: 'Flamingo Honk', price: 1000, description: 'Pink wading birds.', tier: 'Gold', serialNumber: 'SND-GOL-1028' },

  // Diamond - 1500 Coins (Sea and Ocean animals)
  { id: 'sound_diamond_1', name: 'Dolphin Click', price: 1500, description: 'Playful dolphin sounds.', tier: 'Diamond', serialNumber: 'SND-DIA-1029' },
  { id: 'sound_diamond_2', name: 'Whale Song', price: 1500, description: 'Deep ocean calls.', tier: 'Diamond', serialNumber: 'SND-DIA-1030' },
  { id: 'sound_diamond_3', name: 'Seal Bark', price: 1500, description: 'Arf arf arf!', tier: 'Diamond', serialNumber: 'SND-DIA-1031' },
  { id: 'sound_diamond_4', name: 'Seagull Call', price: 1500, description: 'Sounds of the beach.', tier: 'Diamond', serialNumber: 'SND-DIA-1032' },
  { id: 'sound_diamond_5', name: 'Walrus Grunt', price: 1500, description: 'Heavy sea mammal sounds.', tier: 'Diamond', serialNumber: 'SND-DIA-1033' },
  { id: 'sound_diamond_6', name: 'Orca Call', price: 1500, description: 'Killer whale communications.', tier: 'Diamond', serialNumber: 'SND-DIA-1034' },
  { id: 'sound_diamond_7', name: 'Penguin Bray', price: 1500, description: 'Ice sliding birds.', tier: 'Diamond', serialNumber: 'SND-DIA-1035' },
  { id: 'sound_diamond_8', name: 'Otter Squeak', price: 1500, description: 'Cute river creatures.', tier: 'Diamond', serialNumber: 'SND-DIA-1036' },
  { id: 'sound_diamond_9', name: 'Sea Lion Roar', price: 1500, description: 'Loud coastal mammal.', tier: 'Diamond', serialNumber: 'SND-DIA-1037' },
  { id: 'sound_diamond_10', name: 'Manatee Sigh', price: 1500, description: 'Gentle sea cow.', tier: 'Diamond', serialNumber: 'SND-DIA-1038' },
  { id: 'sound_diamond_11', name: 'Shark Splash', price: 1500, description: 'A predatory breach.', tier: 'Diamond', serialNumber: 'SND-DIA-1039' },
  { id: 'sound_diamond_12', name: 'Beluga Chirp', price: 1500, description: 'Canary of the sea.', tier: 'Diamond', serialNumber: 'SND-DIA-1040' },
  { id: 'sound_diamond_13', name: 'Crab Click', price: 1500, description: 'Pinching claws.', tier: 'Diamond', serialNumber: 'SND-DIA-1041' },
  { id: 'sound_diamond_14', name: 'Jellyfish Swish', price: 1500, description: 'Underwater motion.', tier: 'Diamond', serialNumber: 'SND-DIA-1042' },
  { id: 'sound_diamond_15', name: 'Squid Ink', price: 1500, description: 'A quick escape sound.', tier: 'Diamond', serialNumber: 'SND-DIA-1043' },

  // Platinum - 2000 Coins (Rare and Mythical/Other animals)
  { id: 'sound_plat_1', name: 'Lion Roar', price: 2000, description: 'King of the jungle.', tier: 'Platinum', serialNumber: 'SND-PLA-1044' },
  { id: 'sound_plat_2', name: 'Elephant Trumpet', price: 2000, description: 'A massive pachyderm call.', tier: 'Platinum', serialNumber: 'SND-PLA-1045' },
  { id: 'sound_plat_3', name: 'Tiger Growl', price: 2000, description: 'A stealthy predator.', tier: 'Platinum', serialNumber: 'SND-PLA-1046' },
  { id: 'sound_plat_4', name: 'T-Rex Roar', price: 2000, description: 'Ancient jurassic power.', tier: 'Platinum', serialNumber: 'SND-PLA-1047' },
  { id: 'sound_plat_5', name: 'Dragon Breath', price: 2000, description: 'Mythical fire breathing.', tier: 'Platinum', serialNumber: 'SND-PLA-1048' },
  { id: 'sound_plat_6', name: 'Unicorn Neigh', price: 2000, description: 'A magical horse.', tier: 'Platinum', serialNumber: 'SND-PLA-1049' },
  { id: 'sound_plat_7', name: 'Phoenix Cry', price: 2000, description: 'A bird of fire.', tier: 'Platinum', serialNumber: 'SND-PLA-1050' },
  { id: 'sound_plat_8', name: 'Griffin Screech', price: 2000, description: 'Half lion half eagle.', tier: 'Platinum', serialNumber: 'SND-PLA-1051' },
  { id: 'sound_plat_9', name: 'Kraken Splash', price: 2000, description: 'A giant sea monster.', tier: 'Platinum', serialNumber: 'SND-PLA-1052' },
  { id: 'sound_plat_10', name: 'Yeti Howl', price: 2000, description: 'Abominable snow beast.', tier: 'Platinum', serialNumber: 'SND-PLA-1053' },
  { id: 'sound_plat_11', name: 'Sasquatch Grunt', price: 2000, description: 'A mysterious primate.', tier: 'Platinum', serialNumber: 'SND-PLA-1054' },
  { id: 'sound_plat_12', name: 'Pegasus Whinny', price: 2000, description: 'Winged horse of legend.', tier: 'Platinum', serialNumber: 'SND-PLA-1055' },
  { id: 'sound_plat_13', name: 'Velociraptor Hiss', price: 2000, description: 'Clever girl.', tier: 'Platinum', serialNumber: 'SND-PLA-1056' },
  { id: 'sound_plat_14', name: 'Panther Snarl', price: 2000, description: 'A dark shadow.', tier: 'Platinum', serialNumber: 'SND-PLA-1057' },
  { id: 'sound_plat_15', name: 'Cerberus Bark', price: 2000, description: 'Three-headed hound.', tier: 'Platinum', serialNumber: 'SND-PLA-1058' }
];
