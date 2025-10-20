// src/handlers/domHandlers.js

export const elements = {};

function decodeMalformedUtf8(text) {
    if (typeof text !== 'string') return text;

    const utf8BytePattern = /[\x80-\xFF]{2,4}/g;

    return text.replace(utf8BytePattern, (match) => {
        try {
            const bytes = new Uint8Array(match.length);
            for (let i = 0; i < match.length; i++) {
                bytes[i] = match.charCodeAt(i);
            }

            const decoder = new TextDecoder('utf-8', { fatal: false });
            const decoded = decoder.decode(bytes);

            if (decoded !== match && decoded.length > 0 && /[\u0080-\uFFFF]/.test(decoded)) {
                return decoded;
            }
        } catch (e) {
            console.warn('Failed to decode UTF-8 sequence:', e);
        }
        return match;
    });
}


function convertEmojiCodes(text) {
    if (typeof text !== 'string') return text;
    
    text = decodeMalformedUtf8(text);
    
    const emojiMap = {
        ':smile:': '😊',
        ':smiley:': '😃',
        ':grin:': '😁',
        ':laughing:': '😆',
        ':joy:': '😂',
        ':wink:': '😉',
        ':blush:': '😊',
        ':heart:': '❤️',
        ':thumbs_up:': '👍',
        ':thumbsup:': '👍',
        ':thumbs_down:': '👎',
        ':thumbsdown:': '👎',
        ':clap:': '👏',
        ':pray:': '🙏',
        ':fire:': '🔥',
        ':rocket:': '🚀',
        ':star:': '⭐',
        ':sparkles:': '✨',
        ':thinking:': '🤔',
        ':bulb:': '💡',
        ':check:': '✅',
        ':cross:': '❌',
        ':warning:': '⚠️',
        ':question:': '❓',
        ':exclamation:': '❗',
        ':point_right:': '👉',
        ':point_left:': '👈',
        ':point_up:': '👆',
        ':point_down:': '👇',
        ':wave:': '👋',
        ':hand:': '✋',
        ':fist:': '✊',
        ':v:': '✌️',
        ':ok_hand:': '👌',
        ':muscle:': '💪',
        ':eyes:': '👀',
        ':ear:': '👂',
        ':nose:': '👃',
        ':mouth:': '👄',
        ':tongue:': '👅',
        ':lips:': '💋',
        ':kiss:': '😘',
        ':sweat:': '😅',
        ':cry:': '😢',
        ':sob:': '😭',
        ':angry:': '😠',
        ':rage:': '😡',
        ':sleepy:': '😴',
        ':sleeping:': '😴',
        ':mask:': '😷',
        ':sick:': '🤒',
        ':thermometer:': '🌡️',
        ':pill:': '💊',
        ':syringe:': '💉',
        ':dna:': '🧬',
        ':microbe:': '🦠',
        ':robot:': '🤖',
        ':alien:': '👽',
        ':ghost:': '👻',
        ':skull:': '💀',
        ':poop:': '💩',
        ':clown:': '🤡',
        ':devil:': '😈',
        ':angel:': '😇',
        ':imp:': '👿',
        ':monkey:': '🐒',
        ':dog:': '🐕',
        ':cat:': '🐱',
        ':mouse:': '🐭',
        ':cow:': '🐄',
        ':pig:': '🐖',
        ':frog:': '🐸',
        ':chicken:': '🐔',
        ':rooster:': '🐓',
        ':rabbit:': '🐰',
        ':fox:': '🦊',
        ':bear:': '🐻',
        ':panda:': '🐼',
        ':koala:': '🐨',
        ':tiger:': '🐯',
        ':lion:': '🦁',
        ':horse:': '🐴',
        ':unicorn:': '🦄',
        ':zebra:': '🦓',
        ':deer:': '🦌',
        ':elephant:': '🐘',
        ':rhinoceros:': '🦏',
        ':hippopotamus:': '🦛',
        ':mouse2:': '🐭',
        ':rat:': '🐀',
        ':hamster:': '🐹',
        ':rabbit2:': '🐰',
        ':chipmunk:': '🐿️',
        ':hedgehog:': '🦔',
        ':bat:': '🦇',
        ':bear2:': '🐻',
        ':koala2:': '🐨',
        ':panda2:': '🐼',
        ':sloth:': '🦥',
        ':otter:': '🦦',
        ':skunk:': '🦨',
        ':raccoon:': '🦝',
        ':badger:': '🦡',
        ':beaver:': '🦫',
        ':turkey:': '🦃',
        ':dodo:': '🦤',
        ':peacock:': '🦚',
        ':parrot:': '🦜',
        ':swan:': '🦢',
        ':flamingo:': '🦩',
        ':dove:': '🕊️',
        ':eagle:': '🦅',
        ':duck:': '🦆',
        ':owl:': '🦉',
        ':butterfly:': '🦋',
        ':bee:': '🐝',
        ':beetle:': '🐞',
        ':ladybug:': '🐞',
        ':ant:': '🐜',
        ':cockroach:': '🪳',
        ':spider:': '🕷️',
        ':scorpion:': '🦂',
        ':mosquito:': '🦟',
        ':fly:': '🪰',
        ':worm:': '🪱',
        ':microbe2:': '🦠',
        ':bouquet:': '💐',
        ':cherry_blossom:': '🌸',
        ':white_flower:': '💮',
        ':rosette:': '🏵️',
        ':rose:': '🌹',
        ':wilted_flower:': '🥀',
        ':hibiscus:': '🌺',
        ':sunflower:': '🌻',
        ':blossom:': '🌼',
        ':tulip:': '🌷',
        ':seedling:': '🌱',
        ':potted_plant:': '🪴',
        ':evergreen_tree:': '🌲',
        ':deciduous_tree:': '🌳',
        ':palm_tree:': '🌴',
        ':cactus:': '🌵',
        ':sheaf_of_rice:': '🌾',
        ':herb:': '🌿',
        ':shamrock:': '☘️',
        ':four_leaf_clover:': '🍀',
        ':maple_leaf:': '🍁',
        ':fallen_leaf:': '🍂',
        ':leaf_fluttering_in_wind:': '🍃',
        ':grapes:': '🍇',
        ':melon:': '🍈',
        ':watermelon:': '🍉',
        ':tangerine:': '🍊',
        ':lemon:': '🍋',
        ':banana:': '🍌',
        ':pineapple:': '🍍',
        ':mango:': '🥭',
        ':apple:': '🍎',
        ':green_apple:': '🍏',
        ':pear:': '🍐',
        ':peach:': '🍑',
        ':cherries:': '🍒',
        ':strawberry:': '🍓',
        ':blueberries:': '🫐',
        ':kiwi_fruit:': '🥝',
        ':tomato:': '🍅',
        ':olive:': '🫒',
        ':coconut:': '🥥',
        ':avocado:': '🥑',
        ':eggplant:': '🍆',
        ':potato:': '🥔',
        ':carrot:': '🥕',
        ':corn:': '🌽',
        ':hot_pepper:': '🌶️',
        ':bell_pepper:': '🫑',
        ':cucumber:': '🥒',
        ':leafy_green:': '🥬',
        ':broccoli:': '🥦',
        ':garlic:': '🧄',
        ':onion:': '🧅',
        ':mushroom:': '🍄',
        ':peanuts:': '🥜',
        ':chestnut:': '🌰',
        ':bread:': '🍞',
        ':croissant:': '🥐',
        ':baguette_bread:': '🥖',
        ':flatbread:': '🫓',
        ':pretzel:': '🥨',
        ':bagel:': '🥯',
        ':pancakes:': '🥞',
        ':waffle:': '🧇',
        ':cheese_wedge:': '🧀',
        ':meat_on_bone:': '🍖',
        ':poultry_leg:': '🍗',
        ':cut_of_meat:': '🥩',
        ':bacon:': '🥓',
        ':hamburger:': '🍔',
        ':fries:': '🍟',
        ':pizza:': '🍕',
        ':hot_dog:': '🌭',
        ':sandwich:': '🥪',
        ':taco:': '🌮',
        ':burrito:': '🌯',
        ':tamale:': '🫔',
        ':stuffed_flatbread:': '🥙',
        ':falafel:': '🧆',
        ':egg:': '🥚',
        ':cooking:': '🍳',
        ':shallow_pan_of_food:': '🥘',
        ':pot_of_food:': '🍲',
        ':fondue:': '🫕',
        ':bowl_with_spoon:': '🥣',
        ':green_salad:': '🥗',
        ':popcorn:': '🍿',
        ':butter:': '🧈',
        ':salt:': '🧂',
        ':canned_food:': '🥫',
        ':bento_box:': '🍱',
        ':rice_cracker:': '🍘',
        ':rice_ball:': '🍙',
        ':cooked_rice:': '🍚',
        ':curry_rice:': '🍛',
        ':steaming_bowl:': '🍜',
        ':spaghetti:': '🍝',
        ':roasted_sweet_potato:': '🍠',
        ':oden:': '🍢',
        ':sushi:': '🍣',
        ':fried_shrimp:': '🍤',
        ':fish_cake_with_swirl:': '🍥',
        ':moon_cake:': '🥮',
        ':dango:': '🍡',
        ':dumpling:': '🥟',
        ':fortune_cookie:': '🥠',
        ':takeout_box:': '🥡',
        ':crab:': '🦀',
        ':lobster:': '🦞',
        ':shrimp:': '🦐',
        ':squid:': '🦑',
        ':oyster:': '🦪',
        ':ice_cream:': '🍦',
        ':shaved_ice:': '🍧',
        ':ice_cream2:': '🍨',
        ':doughnut:': '🍩',
        ':cookie:': '🍪',
        ':birthday_cake:': '🎂',
        ':shortcake:': '🍰',
        ':cupcake:': '🧁',
        ':pie:': '🥧',
        ':chocolate_bar:': '🍫',
        ':candy:': '🍬',
        ':lollipop:': '🍭',
        ':custard:': '🍮',
        ':honey_pot:': '🍯',
        ':baby_bottle:': '🍼',
        ':glass_of_milk:': '🥛',
        ':hot_beverage:': '☕',
        ':teapot:': '🫖',
        ':teacup_without_handle:': '🍵',
        ':sake:': '🍶',
        ':bottle_with_popping_cork:': '🍾',
        ':wine_glass:': '🍷',
        ':cocktail_glass:': '🍸',
        ':tropical_drink:': '🍹',
        ':beer_mug:': '🍺',
        ':beers:': '🍻',
        ':clinking_glasses:': '🥂',
        ':tumbler_glass:': '🥃',
        ':cup_with_straw:': '🥤',
        ':bubble_tea:': '🧋',
        ':beverage_box:': '🧃',
        ':mate:': '🧉',
        ':ice_cube:': '🧊',
        ':chopsticks:': '🥢',
        ':fork_and_knife_with_plate:': '🍽️',
        ':fork_and_knife:': '🍴',
        ':spoon:': '🥄',
        ':kitchen_knife:': '🔪',
        ':amphora:': '🏺',
        ':earth_africa:': '🌍',
        ':earth_americas:': '🌎',
        ':earth_asia:': '🌏',
        ':globe_with_meridians:': '🌐',
        ':world_map:': '🗺️',
        ':japan:': '🗾',
        ':compass:': '🧭',
        ':mountain_snow:': '🏔️',
        ':mountain:': '⛰️',
        ':volcano:': '🌋',
        ':mount_fuji:': '🗻',
        ':camping:': '🏕️',
        ':beach_umbrella:': '🏖️',
        ':desert:': '🏜️',
        ':desert_island:': '🏝️',
        ':national_park:': '🏞️',
        ':stadium:': '🏟️',
        ':classical_building:': '🏛️',
        ':building_construction:': '🏗️',
        ':bricks:': '🧱',
        ':rock:': '🪨',
        ':wood:': '🪵',
        ':hut:': '🛖',
        ':houses:': '🏘️',
        ':derelict_house:': '🏚️',
        ':house:': '🏠',
        ':house_with_garden:': '🏡',
        ':office_building:': '🏢',
        ':japanese_post_office:': '🏣',
        ':post_office:': '🏤',
        ':hospital:': '🏥',
        ':bank:': '🏦',
        ':hotel:': '🏨',
        ':love_hotel:': '🏩',
        ':convenience_store:': '🏪',
        ':school:': '🏫',
        ':department_store:': '🏬',
        ':factory:': '🏭',
        ':japanese_castle:': '🏯',
        ':castle:': '🏰',
        ':wedding:': '💒',
        ':tokyo_tower:': '🗼',
        ':statue_of_liberty:': '🗽',
        ':church:': '⛪',
        ':mosque:': '🕌',
        ':hindu_temple:': '🛕',
        ':synagogue:': '🕍',
        ':shinto_shrine:': '⛩️',
        ':kaaba:': '🕋',
        ':fountain:': '⛲',
        ':tent:': '⛺',
        ':foggy:': '🌁',
        ':night_with_stars:': '🌃',
        ':cityscape:': '🏙️',
        ':sunrise_over_mountains:': '🌄',
        ':sunrise:': '🌅',
        ':city_sunset:': '🌆',
        ':city_sunrise:': '🌇',
        ':bridge_at_night:': '🌉',
        ':hot_springs:': '♨️',
        ':carousel_horse:': '🎠',
        ':ferris_wheel:': '🎡',
        ':roller_coaster:': '🎢',
        ':barber_pole:': '💈',
        ':circus_tent:': '🎪',
        ':locomotive:': '🚂',
        ':railway_car:': '🚃',
        ':high_speed_train:': '🚄',
        ':bullet_train:': '🚅',
        ':train:': '🚆',
        ':metro:': '🚇',
        ':light_rail:': '🚈',
        ':station:': '🚉',
        ':tram:': '🚊',
        ':monorail:': '🚝',
        ':mountain_railway:': '🚞',
        ':tram_car:': '🚋',
        ':bus:': '🚌',
        ':oncoming_bus:': '🚍',
        ':trolleybus:': '🚎',
        ':minibus:': '🚐',
        ':ambulance:': '🚑',
        ':fire_engine:': '🚒',
        ':police_car:': '🚓',
        ':oncoming_police_car:': '🚔',
        ':taxi:': '🚕',
        ':oncoming_taxi:': '🚖',
        ':automobile:': '🚗',
        ':oncoming_automobile:': '🚘',
        ':sport_utility_vehicle:': '🚙',
        ':pickup_truck:': '🛻',
        ':delivery_truck:': '🚚',
        ':articulated_lorry:': '🚛',
        ':tractor:': '🚜',
        ':racing_car:': '🏎️',
        ':motorcycle:': '🏍️',
        ':motor_scooter:': '🛵',
        ':manual_wheelchair:': '🦽',
        ':motorized_wheelchair:': '🦼',
        ':auto_rickshaw:': '🛺',
        ':bike:': '🚲',
        ':kick_scooter:': '🛴',
        ':skateboard:': '🛹',
        ':roller_skate:': '🛼',
        ':busstop:': '🚏',
        ':motorway:': '🛣️',
        ':railway_track:': '🛤️',
        ':fuelpump:': '⛽',
        ':rotating_light:': '🚨',
        ':traffic_light:': '🚥',
        ':vertical_traffic_light:': '🚦',
        ':stop_sign:': '🛑',
        ':construction:': '🚧',
        ':anchor:': '⚓',
        ':boat:': '⛵',
        ':canoe:': '🛶',
        ':speedboat:': '🚤',
        ':passenger_ship:': '🛳️',
        ':ferry:': '⛴️',
        ':motor_boat:': '🛥️',
        ':ship:': '🚢',
        ':airplane:': '✈️',
        ':small_airplane:': '🛩️',
        ':airplane_departure:': '🛫',
        ':airplane_arrival:': '🛬',
        ':parachute:': '🪂',
        ':seat:': '💺',
        ':helicopter:': '🚁',
        ':suspension_railway:': '🚟',
        ':mountain_cableway:': '🚠',
        ':aerial_tramway:': '🚡',
        ':satellite:': '🛰️',
        ':rocket2:': '🚀',
        ':flying_saucer:': '🛸',
        ':bellhop_bell:': '🛎️',
        ':luggage:': '🧳',
        ':hourglass:': '⌛',
        ':hourglass_flowing_sand:': '⏳',
        ':watch:': '⌚',
        ':alarm_clock:': '⏰',
        ':stopwatch:': '⏱️',
        ':timer_clock:': '⏲️',
        ':mantelpiece_clock:': '🕰️',
        ':twelve_oclock:': '🕛',
        ':twelve_thirty:': '🕧',
        ':one_oclock:': '🕐',
        ':one_thirty:': '🕜',
        ':two_oclock:': '🕑',
        ':two_thirty:': '🕝',
        ':three_oclock:': '🕒',
        ':three_thirty:': '🕞',
        ':four_oclock:': '🕓',
        ':four_thirty:': '🕟',
        ':five_oclock:': '🕔',
        ':five_thirty:': '🕠',
        ':six_oclock:': '🕕',
        ':six_thirty:': '🕡',
        ':seven_oclock:': '🕖',
        ':seven_thirty:': '🕢',
        ':eight_oclock:': '🕗',
        ':eight_thirty:': '🕣',
        ':nine_oclock:': '🕘',
        ':nine_thirty:': '🕤',
        ':ten_oclock:': '🕙',
        ':ten_thirty:': '🕥',
        ':eleven_oclock:': '🕚',
        ':eleven_thirty:': '🕦',
        ':new_moon:': '🌑',
        ':waxing_crescent_moon:': '🌒',
        ':first_quarter_moon:': '🌓',
        ':waxing_gibbous_moon:': '🌔',
        ':full_moon:': '🌕',
        ':waning_gibbous_moon:': '🌖',
        ':last_quarter_moon:': '🌗',
        ':waning_crescent_moon:': '🌘',
        ':crescent_moon:': '🌙',
        ':new_moon_with_face:': '🌚',
        ':first_quarter_moon_with_face:': '🌛',
        ':last_quarter_moon_with_face:': '🌜',
        ':thermometer2:': '🌡️',
        ':sunny:': '☀️',
        ':full_moon_with_face:': '🌝',
        ':sun_with_face:': '🌞',
        ':ringed_planet:': '🪐',
        ':star2:': '⭐',
        ':stars:': '🌟',
        ':milky_way:': '🌌',
        ':cloud:': '☁️',
        ':partly_sunny:': '⛅',
        ':cloud_with_lightning_and_rain:': '⛈️',
        ':sun_behind_small_cloud:': '🌤️',
        ':sun_behind_large_cloud:': '🌥️',
        ':sun_behind_rain_cloud:': '🌦️',
        ':cloud_with_rain:': '🌧️',
        ':cloud_with_snow:': '🌨️',
        ':cloud_with_lightning:': '🌩️',
        ':tornado:': '🌪️',
        ':fog:': '🌫️',
        ':wind_face:': '🌬️',
        ':cyclone:': '🌀',
        ':rainbow:': '🌈',
        ':closed_umbrella:': '🌂',
        ':umbrella:': '☂️',
        ':umbrella_with_rain_drops:': '☔',
        ':umbrella_on_ground:': '⛱️',
        ':zap:': '⚡',
        ':snowflake:': '❄️',
        ':snowman:': '☃️',
        ':snowman_without_snow:': '⛄',
        ':comet:': '☄️',
        ':fire2:': '🔥',
        ':droplet:': '💧',
        ':ocean:': '🌊',
        ':jack_o_lantern:': '🎃',
        ':christmas_tree:': '🎄',
        ':fireworks:': '🎆',
        ':sparkler:': '🎇',
        ':firecracker:': '🧨',
        ':sparkles2:': '✨',
        ':balloon:': '🎈',
        ':tada:': '🎉',
        ':confetti_ball:': '🎊',
        ':tanabata_tree:': '🎋',
        ':bamboo:': '🎍',
        ':dolls:': '🎎',
        ':flags:': '🎏',
        ':wind_chime:': '🎐',
        ':rice_scene:': '🎑',
        ':red_envelope:': '🧧',
        ':ribbon:': '🎀',
        ':gift:': '🎁',
        ':reminder_ribbon:': '🎗️',
        ':admission_tickets:': '🎫',
        ':ticket:': '🎟️',
        ':military_medal:': '🎖️',
        ':trophy:': '🏆',
        ':sports_medal:': '🏅',
        ':first_place_medal:': '🥇',
        ':second_place_medal:': '🥈',
        ':third_place_medal:': '🥉',
        ':soccer:': '⚽',
        ':baseball:': '⚾',
        ':softball:': '🥎',
        ':basketball:': '🏀',
        ':volleyball:': '🏐',
        ':football:': '🏈',
        ':rugby_football:': '🏉',
        ':tennis:': '🎾',
        ':flying_disc:': '🥏',
        ':bowling:': '🎳',
        ':cricket_game:': '🏏',
        ':field_hockey:': '🏑',
        ':ice_hockey:': '🏒',
        ':lacrosse:': '🥍',
        ':ping_pong:': '🏓',
        ':badminton:': '🏸',
        ':boxing_glove:': '🥊',
        ':martial_arts_uniform:': '🥋',
        ':goal_net:': '🥅',
        ':golf:': '⛳',
        ':ice_skate:': '⛸️',
        ':fishing_pole:': '🎣',
        ':diving_mask:': '🤿',
        ':running_shirt_with_sash:': '🎽',
        ':ski:': '🎿',
        ':sled:': '🛷',
        ':curling_stone:': '🥌',
        ':bullseye:': '🎯',
        ':yo_yo:': '🪀',
        ':kite:': '🪁',
        ':pool_8_ball:': '🎱',
        ':crystal_ball:': '🔮',
        ':magic_wand:': '🪄',
        ':nazar_amulet:': '🧿',
        ':video_game:': '🎮',
        ':joystick:': '🕹️',
        ':slot_machine:': '🎰',
        ':game_die:': '🎲',
        ':puzzle_piece:': '🧩',
        ':teddy_bear:': '🧸',
        ':piñata:': '🪅',
        ':nesting_dolls:': '🪆',
        ':spade_suit:': '♠️',
        ':heart_suit:': '♥️',
        ':diamond_suit:': '♦️',
        ':club_suit:': '♣️',
        ':chess_pawn:': '♟️',
        ':joker:': '🃏',
        ':mahjong_red_dragon:': '🀄',
        ':flower_playing_cards:': '🎴',
        ':performing_arts:': '🎭',
        ':framed_picture:': '🖼️',
        ':artist_palette:': '🎨',
        ':thread:': '🧵',
        ':sewing_needle:': '🪡',
        ':yarn:': '🧶',
        ':knot:': '🪢',
        ':glasses:': '👓',
        ':sunglasses:': '🕶️',
        ':goggles:': '🥽',
        ':lab_coat:': '🥼',
        ':safety_vest:': '🦺',
        ':necktie:': '👔',
        ':t_shirt:': '👕',
        ':jeans:': '👖',
        ':scarf:': '🧣',
        ':gloves:': '🧤',
        ':coat:': '🧥',
        ':socks:': '🧦',
        ':dress:': '👗',
        ':kimono:': '👘',
        ':sari:': '🥻',
        ':one_piece_swimsuit:': '🩱',
        ':briefs:': '🩲',
        ':shorts:': '🩳',
        ':bikini:': '👙',
        ':womans_clothes:': '👚',
        ':purse:': '👛',
        ':handbag:': '👜',
        ':clutch_bag:': '👝',
        ':shopping_bags:': '🛍️',
        ':backpack:': '🎒',
        ':mans_shoe:': '👞',
        ':athletic_shoe:': '👟',
        ':hiking_boot:': '🥾',
        ':flat_shoe:': '🥿',
        ':high_heeled_shoe:': '👠',
        ':womans_sandal:': '👡',
        ':ballet_shoes:': '🩰',
        ':womans_boot:': '👢',
        ':crown:': '👑',
        ':womans_hat:': '👒',
        ':top_hat:': '🎩',
        ':graduation_cap:': '🎓',
        ':billed_cap:': '🧢',
        ':military_helmet:': '🪖',
        ':rescue_worker_helmet:': '⛑️',
        ':prayer_beads:': '📿',
        ':lipstick:': '💄',
        ':ring:': '💍',
        ':gem_stone:': '💎',
        ':muted_speaker:': '🔇',
        ':speaker_low_volume:': '🔈',
        ':speaker_medium_volume:': '🔉',
        ':speaker_high_volume:': '🔊',
        ':loudspeaker:': '📢',
        ':mega:': '📣',
        ':postal_horn:': '📯',
        ':bell:': '🔔',
        ':bell_with_slash:': '🔕',
        ':musical_score:': '🎼',
        ':musical_note:': '🎵',
        ':notes:': '🎶',
        ':studio_microphone:': '🎙️',
        ':level_slider:': '🎚️',
        ':control_knobs:': '🎛️',
        ':microphone:': '🎤',
        ':headphone:': '🎧',
        ':radio:': '📻',
        ':saxophone:': '🎷',
        ':accordion:': '🪗',
        ':guitar:': '🎸',
        ':musical_keyboard:': '🎹',
        ':trumpet:': '🎺',
        ':violin:': '🎻',
        ':banjo:': '🪕',
        ':drum:': '🥁',
        ':long_drum:': '🪘',
        ':mobile_phone:': '📱',
        ':mobile_phone_with_arrow:': '📲',
        ':telephone:': '☎️',
        ':telephone_receiver:': '📞',
        ':pager:': '📟',
        ':fax_machine:': '📠',
        ':battery:': '🔋',
        ':electric_plug:': '🔌',
        ':laptop:': '💻',
        ':desktop_computer:': '🖥️',
        ':printer:': '🖨️',
        ':keyboard:': '⌨️',
        ':computer_mouse:': '🖱️',
        ':trackball:': '🖲️',
        ':computer_disk:': '💽',
        ':floppy_disk:': '💾',
        ':optical_disk:': '💿',
        ':dvd:': '📀',
        ':abacus:': '🧮',
        ':movie_camera:': '🎥',
        ':film_strip:': '🎞️',
        ':film_projector:': '📽️',
        ':clapper_board:': '🎬',
        ':television:': '📺',
        ':camera:': '📷',
        ':camera_with_flash:': '📸',
        ':video_camera:': '📹',
        ':videocassette:': '📼',
        ':magnifying_glass_tilted_left:': '🔍',
        ':magnifying_glass_tilted_right:': '🔎',
        ':candle:': '🕯️',
        ':light_bulb:': '💡',
        ':flashlight:': '🔦',
        ':red_paper_lantern:': '🏮',
        ':diya_lamp:': '🪔',
        ':notebook_with_decorative_cover:': '📔',
        ':closed_book:': '📕',
        ':open_book:': '📖',
        ':green_book:': '📗',
        ':blue_book:': '📘',
        ':orange_book:': '📚',
        ':books:': '📚',
        ':notebook:': '📓',
        ':ledger:': '📒',
        ':page_with_curl:': '📃',
        ':scroll:': '📜',
        ':page_facing_up:': '📄',
        ':newspaper:': '📰',
        ':rolled_up_newspaper:': '🗞️',
        ':bookmark_tabs:': '📑',
        ':bookmark:': '🔖',
        ':label:': '🏷️',
        ':money_bag:': '💰',
        ':coin:': '🪙',
        ':yen_banknote:': '💴',
        ':dollar_banknote:': '💵',
        ':euro_banknote:': '💶',
        ':pound_banknote:': '💷',
        ':money_with_wings:': '💸',
        ':credit_card:': '💳',
        ':receipt:': '🧾',
        ':chart_increasing_with_yen:': '💹',
        ':envelope:': '✉️',
        ':e_mail:': '📧',
        ':incoming_envelope:': '📨',
        ':envelope_with_arrow:': '📩',
        ':outbox_tray:': '📤',
        ':inbox_tray:': '📥',
        ':package:': '📦',
        ':closed_mailbox_with_raised_flag:': '📬',
        ':closed_mailbox_with_lowered_flag:': '📭',
        ':open_mailbox_with_raised_flag:': '📬',
        ':open_mailbox_with_lowered_flag:': '📭',
        ':postbox:': '📮',
        ':ballot_box_with_ballot:': '🗳️',
        ':pencil:': '✏️',
        ':black_nib:': '✒️',
        ':fountain_pen:': '🖋️',
        ':pen:': '🖊️',
        ':paintbrush:': '🖌️',
        ':crayon:': '🖍️',
        ':memo:': '📝',
        ':briefcase:': '💼',
        ':file_folder:': '📁',
        ':open_file_folder:': '📂',
        ':card_index_dividers:': '🗂️',
        ':calendar:': '📅',
        ':tear_off_calendar:': '📆',
        ':spiral_notepad:': '🗒️',
        ':spiral_calendar:': '🗓️',
        ':card_index:': '📇',
        ':chart_increasing:': '📈',
        ':chart_decreasing:': '📉',
        ':bar_chart:': '📊',
        ':clipboard:': '📋',
        ':pushpin:': '📌',
        ':round_pushpin:': '📍',
        ':paperclip:': '📎',
        ':linked_paperclips:': '🖇️',
        ':straight_ruler:': '📏',
        ':triangular_ruler:': '📐',
        ':scissors:': '✂️',
        ':card_file_box:': '🗃️',
        ':file_cabinet:': '🗄️',
        ':wastebasket:': '🗑️',
        ':locked:': '🔒',
        ':unlocked:': '🔓',
        ':locked_with_pen:': '🔏',
        ':locked_with_key:': '🔐',
        ':key:': '🔑',
        ':old_key:': '🗝️',
        ':hammer:': '🔨',
        ':axe:': '🪓',
        ':pick:': '⛏️',
        ':hammer_and_pick:': '⚒️',
        ':hammer_and_wrench:': '🛠️',
        ':dagger:': '🗡️',
        ':crossed_swords:': '⚔️',
        ':gun:': '🔫',
        ':boomerang:': '🪃',
        ':bow_and_arrow:': '🏹',
        ':shield:': '🛡️',
        ':carpentry_saw:': '🪚',
        ':wrench:': '🔧',
        ':screwdriver:': '🪛',
        ':nut_and_bolt:': '🔩',
        ':gear:': '⚙️',
        ':clamp:': '🗜️',
        ':balance_scale:': '⚖️',
        ':white_cane:': '🦯',
        ':link:': '🔗',
        ':chains:': '⛓️',
        ':hook:': '🪝',
        ':toolbox:': '🧰',
        ':magnet:': '🧲',
        ':ladder:': '🪜',
        ':alembic:': '⚗️',
        ':test_tube:': '🧪',
        ':petri_dish:': '🧫',
        ':dna2:': '🧬',
        ':microscope:': '🔬',
        ':telescope:': '🔭',
        ':satellite_antenna:': '📡',
        ':syringe2:': '💉',
        ':drop_of_blood:': '🩸',
        ':pill2:': '💊',
        ':adhesive_bandage:': '🩹',
        ':crutch:': '🩼',
        ':stethoscope:': '🩺',
        ':x_ray:': '🩻',
        ':door:': '🚪',
        ':elevator:': '🛗',
        ':mirror:': '🪞',
        ':window:': '🪟',
        ':bed:': '🛏️',
        ':couch_and_lamp:': '🛋️',
        ':chair:': '🪑',
        ':toilet:': '🚽',
        ':plunger:': '🪠',
        ':shower:': '🚿',
        ':bathtub:': '🛁',
        ':mouse_trap:': '🪤',
        ':razor:': '🪒',
        ':lotion_bottle:': '🧴',
        ':safety_pin:': '🧷',
        ':broom:': '🧹',
        ':basket:': '🧺',
        ':roll_of_paper:': '🧻',
        ':bucket:': '🪣',
        ':soap:': '🧼',
        ':sponge:': '🧽',
        ':fire_extinguisher:': '🧯',
        ':shopping_cart:': '🛒',
        ':cigarette:': '🚬',
        ':coffin:': '⚰️',
        ':headstone:': '🪦',
        ':funeral_urn:': '⚱️',
        ':moai:': '🗿',
        ':placard:': '🪧',
        ':identification_card:': '🪪',
        ':atm_sign:': '🏧',
        ':litter_in_bin_sign:': '🚮',
        ':potable_water:': '🚰',
        ':wheelchair_symbol:': '♿',
        ':mens_room:': '🚹',
        ':womens_room:': '🚺',
        ':restroom:': '🚻',
        ':baby_symbol:': '🚼',
        ':water_closet:': '🚾',
        ':passport_control:': '🛂',
        ':customs:': '🛃',
        ':baggage_claim:': '🛄',
        ':left_luggage:': '🛅',
        ':warning2:': '⚠️',
        ':children_crossing:': '🚸',
        ':no_entry:': '⛔',
        ':no_entry_sign:': '🚫',
        ':no_bicycles:': '🚳',
        ':no_smoking:': '🚭',
        ':do_not_litter:': '🚯',
        ':non_potable_water:': '🚱',
        ':no_pedestrians:': '🚷',
        ':no_mobile_phones:': '📵',
        ':underage:': '🔞',
        ':radioactive:': '☢️',
        ':biohazard:': '☣️',
        ':arrow_up:': '⬆️',
        ':arrow_upper_right:': '↗️',
        ':arrow_right:': '➡️',
        ':arrow_lower_right:': '↘️',
        ':arrow_down:': '⬇️',
        ':arrow_lower_left:': '↙️',
        ':arrow_left:': '⬅️',
        ':arrow_upper_left:': '↖️',
        ':arrow_up_down:': '↕️',
        ':left_right_arrow:': '↔️',
        ':leftwards_arrow_with_hook:': '↩️',
        ':arrow_right_hook:': '↪️',
        ':arrow_heading_up:': '⤴️',
        ':arrow_heading_down:': '⤵️',
        ':arrows_clockwise:': '🔄',
        ':arrows_counterclockwise:': '🔄',
        ':back_arrow:': '🔙',
        ':end_arrow:': '🔚',
        ':on_arrow:': '🔛',
        ':soon_arrow:': '🔜',
        ':top_arrow:': '🔝',
        ':place_of_worship:': '🛐',
        ':atom_symbol:': '⚛️',
        ':om:': '🕉️',
        ':star_of_david:': '✡️',
        ':wheel_of_dharma:': '☸️',
        ':yin_yang:': '☯️',
        ':latin_cross:': '✝️',
        ':orthodox_cross:': '☦️',
        ':star_and_crescent:': '☪️',
        ':peace_symbol:': '☮️',
        ':menorah:': '🕎',
        ':dotted_six_pointed_star:': '🔯',
        ':aries:': '♈',
        ':taurus:': '♉',
        ':gemini:': '♊',
        ':cancer:': '♋',
        ':leo:': '♌',
        ':virgo:': '♍',
        ':libra:': '♎',
        ':scorpius:': '♏',
        ':sagittarius:': '♐',
        ':capricorn:': '♑',
        ':aquarius:': '♒',
        ':pisces:': '♓',
        ':ophiuchus:': '⛎',
        ':twisted_rightwards_arrows:': '🔀',
        ':repeat:': '🔁',
        ':repeat_one:': '🔂',
        ':fast_forward:': '⏩',
        ':fast_reverse:': '⏪',
        ':play_or_pause_button:': '⏯️',
        ':up_button:': '🔼',
        ':fast_up_button:': '⏫',
        ':down_button:': '🔽',
        ':fast_down_button:': '⏬',
        ':pause_button:': '⏸️',
        ':stop_button:': '⏹️',
        ':record_button:': '⏺️',
        ':eject_button:': '⏏️',
        ':cinema:': '🎦',
        ':dim_button:': '🔅',
        ':bright_button:': '🔆',
        ':antenna_bars:': '📶',
        ':vibration_mode:': '📳',
        ':mobile_phone_off:': '📴',
        ':female_sign:': '♀️',
        ':male_sign:': '♂️',
        ':transgender_symbol:': '⚧️',
        ':multiply:': '✖️',
        ':plus:': '➕',
        ':minus:': '➖',
        ':divide:': '➗',
        ':heavy_equals_sign:': '🟰',
        ':infinity:': '♾️',
        ':bangbang:': '‼️',
        ':interrobang:': '⁉️',
        ':question2:': '❓',
        ':grey_question:': '❔',
        ':grey_exclamation:': '❕',
        ':exclamation:': '❗',
        ':wavy_dash:': '〰️',
        ':currency_exchange:': '💱',
        ':heavy_dollar_sign:': '💲',
        ':medical_symbol:': '⚕️',
        ':recycling_symbol:': '♻️',
        ':fleur_de_lis:': '⚜️',
        ':trident_emblem:': '🔱',
        ':name_badge:': '📛',
        ':japanese_symbol_for_beginner:': '🔰',
        ':hollow_red_circle:': '⭕',
        ':white_circle_button:': '⚪',
        ':black_circle_button:': '⚫',
        ':white_square_button:': '🔳',
        ':black_square_button:': '⬛',
        ':black_small_square:': '▪️',
        ':white_small_square:': '▫️',
        ':black_medium_small_square:': '◾',
        ':white_medium_small_square:': '◽',
        ':black_medium_square:': '◼️',
        ':white_medium_square:': '◻️',
        ':black_large_square:': '⬜',
        ':white_large_square:': '⬜',
        ':orange_square:': '🟧',
        ':blue_square:': '🟦',
        ':red_square:': '🟥',
        ':brown_square:': '🟫',
        ':purple_square:': '🟣',
        ':green_square:': '🟩',
        ':yellow_square:': '🟨',
        ':orange_circle:': '🟠',
        ':blue_circle:': '🔵',
        ':red_circle:': '🔴',
        ':brown_circle:': '🟤',
        ':purple_circle:': '🟣',
        ':green_circle:': '🟢',
        ':yellow_circle:': '🟡',
        ':red_triangle_pointed_up:': '🔺',
        ':red_triangle_pointed_down:': '🔻',
        ':small_orange_diamond:': '🔸',
        ':small_blue_diamond:': '🔹',
        ':large_orange_diamond:': '🔶',
        ':large_blue_diamond:': '🔷',
        ':white_square_button2:': '🔳',
        ':black_square_button2:': '⬛',
        ':checkered_flag:': '🏁',
        ':triangular_flag:': '🚩',
        ':crossed_flags:': '🎌',
        ':black_flag:': '🏴',
        ':white_flag:': '🏳️',
        ':rainbow_flag:': '🏳️‍🌈',
        ':transgender_flag:': '🏳️‍⚧️',
        ':pirate_flag:': '🏴‍☠️',
        ':ascension_island:': '🇦🇨',
        ':andorra:': '🇦🇩',
        ':united_arab_emirates:': '🇦🇪',
        ':afghanistan:': '🇦🇫',
        ':antigua_barbuda:': '🇦🇬',
        ':anguilla:': '🇦🇮',
        ':albania:': '🇦🇱',
        ':armenia:': '🇦🇲',
        ':angola:': '🇦🇴',
        ':antarctica:': '🇦🇶',
        ':argentina:': '🇦🇷',
        ':american_samoa:': '🇦🇸',
        ':austria:': '🇦🇹',
        ':australia:': '🇦🇺',
        ':aruba:': '🇦🇼',
        ':aland_islands:': '🇦🇽',
        ':azerbaijan:': '🇦🇿',
        ':bosnia_herzegovina:': '🇧🇦',
        ':barbados:': '🇧🇧',
        ':bangladesh:': '🇧🇩',
        ':belgium:': '🇧🇪',
        ':burkina_faso:': '🇧🇫',
        ':bulgaria:': '🇧🇬',
        ':bahrain:': '🇧🇭',
        ':burundi:': '🇧🇮',
        ':benin:': '🇧🇯',
        ':bermuda:': '🇧🇲',
        ':brunei:': '🇧🇳',
        ':bolivia:': '🇧🇴',
        ':caribbean_netherlands:': '🇧🇶',
        ':brazil:': '🇧🇷',
        ':bahamas:': '🇧🇸',
        ':bhutan:': '🇧🇹',
        ':bouvet_island:': '🇧🇻',
        ':botswana:': '🇧🇼',
        ':belarus:': '🇧🇾',
        ':belize:': '🇧🇿',
        ':canada:': '🇨🇦',
        ':cocos_islands:': '🇨🇨',
        ':congo_kinshasa:': '🇨🇩',
        ':central_african_republic:': '🇨🇫',
        ':congo_brazzaville:': '🇨🇬',
        ':switzerland:': '🇨🇭',
        ':cote_divoire:': '🇨🇮',
        ':cook_islands:': '🇨🇰',
        ':chile:': '🇨🇱',
        ':cameroon:': '🇨🇲',
        ':cn:': '🇨🇳',
        ':colombia:': '🇨🇴',
        ':clipperton_island:': '🇨🇵',
        ':costa_rica:': '🇨🇷',
        ':cuba:': '🇨🇺',
        ':cape_verde:': '🇨🇻',
        ':curacao:': '🇨🇼',
        ':christmas_island:': '🇨🇽',
        ':cyprus:': '🇨🇾',
        ':czechia:': '🇨🇿',
        ':de:': '🇩🇪',
        ':diego_garcia:': '🇩🇬',
        ':djibouti:': '🇩🇯',
        ':denmark:': '🇩🇰',
        ':dominica:': '🇩🇲',
        ':dominican_republic:': '🇩🇴',
        ':algeria:': '🇩🇿',
        ':ceuta_melilla:': '🇪🇦',
        ':ecuador:': '🇪🇨',
        ':estonia:': '🇪🇪',
        ':egypt:': '🇪🇬',
        ':western_sahara:': '🇪🇭',
        ':eritrea:': '🇪🇷',
        ':es:': '🇪🇸',
        ':ethiopia:': '🇪🇹',
        ':eu:': '🇪🇺',
        ':finland:': '🇫🇮',
        ':fiji:': '🇫🇯',
        ':falkland_islands:': '🇫🇰',
        ':micronesia:': '🇫🇲',
        ':faroe_islands:': '🇫🇴',
        ':fr:': '🇫🇷',
        ':gabon:': '🇬🇧',
        ':gb:': '🇬🇧',
        ':grenada:': '🇬🇩',
        ':georgia:': '🇬🇪',
        ':french_guiana:': '🇬🇫',
        ':guernsey:': '🇬🇬',
        ':ghana:': '🇬🇭',
        ':gibraltar:': '🇬🇮',
        ':greenland:': '🇬🇱',
        ':gambia:': '🇬🇲',
        ':guinea:': '🇬🇳',
        ':guadeloupe:': '🇬🇵',
        ':equatorial_guinea:': '🇬🇶',
        ':greece:': '🇬🇷',
        ':south_georgia_south_sandwich_islands:': '🇬🇸',
        ':guatemala:': '🇬🇹',
        ':guam:': '🇬🇺',
        ':guinea_bissau:': '🇬🇼',
        ':guyana:': '🇬🇾',
        ':hong_kong:': '🇭🇰',
        ':heard_mcdonald_islands:': '🇭🇲',
        ':honduras:': '🇭🇳',
        ':croatia:': '🇭🇷',
        ':haiti:': '🇭🇹',
        ':hungary:': '🇭🇺',
        ':canary_islands:': '🇮🇨',
        ':indonesia:': '🇮🇩',
        ':ireland:': '🇮🇪',
        ':israel:': '🇮🇱',
        ':isle_of_man:': '🇮🇲',
        ':india:': '🇮🇳',
        ':british_indian_ocean_territory:': '🇮🇴',
        ':iraq:': '🇮🇶',
        ':iran:': '🇮🇷',
        ':iceland:': '🇮🇸',
        ':it:': '🇮🇹',
        ':jersey:': '🇯🇪',
        ':jamaica:': '🇯🇲',
        ':jordan:': '🇯🇴',
        ':jp:': '🇯🇵',
        ':kenya:': '🇰🇪',
        ':kyrgyzstan:': '🇰🇬',
        ':cambodia:': '🇰🇭',
        ':kiribati:': '🇰🇮',
        ':comoros:': '🇰🇲',
        ':st_kitts_nevis:': '🇰🇳',
        ':north_korea:': '🇰🇵',
        ':kr:': '🇰🇷',
        ':kuwait:': '🇰🇼',
        ':cayman_islands:': '🇰🇾',
        ':kazakhstan:': '🇰🇿',
        ':laos:': '🇱🇦',
        ':lebanon:': '🇱🇧',
        ':st_lucia:': '🇱🇨',
        ':liechtenstein:': '🇱🇮',
        ':sri_lanka:': '🇱🇰',
        ':liberia:': '🇱🇷',
        ':lesotho:': '🇱🇸',
        ':lithuania:': '🇱🇹',
        ':luxembourg:': '🇱🇺',
        ':latvia:': '🇱🇻',
        ':libya:': '🇱🇾',
        ':morocco:': '🇲🇦',
        ':monaco:': '🇲🇨',
        ':moldova:': '🇲🇩',
        ':montenegro:': '🇲🇪',
        ':st_martin:': '🇲🇫',
        ':madagascar:': '🇲🇬',
        ':marshall_islands:': '🇲🇭',
        ':north_macedonia:': '🇲🇰',
        ':mali:': '🇲🇱',
        ':myanmar:': '🇲🇲',
        ':mongolia:': '🇲🇳',
        ':macau:': '🇲🇴',
        ':northern_mariana_islands:': '🇲🇵',
        ':martinique:': '🇲🇶',
        ':mauritania:': '🇲🇷',
        ':montserrat:': '🇲🇸',
        ':malta:': '🇲🇹',
        ':mauritius:': '🇲🇺',
        ':maldives:': '🇲🇻',
        ':malawi:': '🇲🇼',
        ':mexico:': '🇲🇽',
        ':malaysia:': '🇲🇾',
        ':mozambique:': '🇲🇿',
        ':namibia:': '🇳🇦',
        ':new_caledonia:': '🇳🇨',
        ':niger:': '🇳🇪',
        ':norfolk_island:': '🇳🇫',
        ':nigeria:': '🇳🇬',
        ':nicaragua:': '🇳🇮',
        ':netherlands:': '🇳🇱',
        ':norway:': '🇳🇴',
        ':nepal:': '🇳🇵',
        ':nauru:': '🇳🇷',
        ':niue:': '🇳🇺',
        ':new_zealand:': '🇳🇿',
        ':oman:': '🇴🇲',
        ':panama:': '🇵🇦',
        ':peru:': '🇵🇪',
        ':french_polynesia:': '🇵🇫',
        ':papua_new_guinea:': '🇵🇬',
        ':philippines:': '🇵🇭',
        ':pakistan:': '🇵🇰',
        ':poland:': '🇵🇱',
        ':st_pierre_miquelon:': '🇵🇲',
        ':pitcairn_islands:': '🇵🇳',
        ':puerto_rico:': '🇵🇷',
        ':palestinian_territories:': '🇵🇸',
        ':portugal:': '🇵🇹',
        ':palau:': '🇵🇼',
        ':paraguay:': '🇵🇾',
        ':qatar:': '🇶🇦',
        ':reunion:': '🇷🇪',
        ':romania:': '🇷🇴',
        ':serbia:': '🇷🇸',
        ':ru:': '🇷🇺',
        ':rwanda:': '🇷🇼',
        ':saudi_arabia:': '🇸🇦',
        ':solomon_islands:': '🇸🇧',
        ':seychelles:': '🇸🇨',
        ':sudan:': '🇸🇩',
        ':sweden:': '🇸🇪',
        ':singapore:': '🇸🇬',
        ':st_helena:': '🇸🇭',
        ':slovenia:': '🇸🇱',
        ':svalbard_jan_mayen:': '🇸🇯',
        ':slovakia:': '🇸🇰',
        ':sierra_leone:': '🇸🇱',
        ':san_marino:': '🇸🇲',
        ':senegal:': '🇸🇳',
        ':somalia:': '🇸🇴',
        ':suriname:': '🇸🇷',
        ':south_sudan:': '🇸🇸',
        ':sao_tome_principe:': '🇸🇹',
        ':el_salvador:': '🇸🇻',
        ':sint_maarten:': '🇸🇽',
        ':syria:': '🇸🇾',
        ':swaziland:': '🇸🇿',
        ':tristan_da_cunha:': '🇹🇦',
        ':turks_caicos_islands:': '🇹🇨',
        ':chad:': '🇹🇩',
        ':french_southern_territories:': '🇹🇫',
        ':togo:': '🇹🇬',
        ':thailand:': '🇹🇭',
        ':tajikistan:': '🇹🇯',
        ':tokelau:': '🇹🇰',
        ':timor_leste:': '🇹🇱',
        ':turkmenistan:': '🇹🇲',
        ':tunisia:': '🇹🇳',
        ':tonga:': '🇹🇴',
        ':tr:': '🇹🇷',
        ':trinidad_tobago:': '🇹🇹',
        ':tuvalu:': '🇹🇻',
        ':taiwan:': '🇹🇼',
        ':tanzania:': '🇹🇿',
        ':ukraine:': '🇺🇦',
        ':uganda:': '🇺🇬',
        ':us_outlying_islands:': '🇺🇲',
        ':united_nations:': '🇺🇳',
        ':us:': '🇺🇸',
        ':uruguay:': '🇺🇾',
        ':uzbekistan:': '🇺🇿',
        ':vatican_city:': '🇻🇦',
        ':st_vincent_grenadines:': '🇻🇨',
        ':venezuela:': '🇻🇪',
        ':british_virgin_islands:': '🇻🇬',
        ':us_virgin_islands:': '🇻🇮',
        ':vietnam:': '🇻🇳',
        ':vanuatu:': '🇻🇺',
        ':wallis_futuna:': '🇼🇫',
        ':samoa:': '🇼🇸',
        ':kosovo:': '🇽🇰',
        ':yemen:': '🇾🇪',
        ':mayotte:': '🇾🇹',
        ':south_africa:': '🇿🇦',
        ':zambia:': '🇿🇲',
        ':zimbabwe:': '🇿🇼',
        ':england:': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        ':scotland:': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
        ':wales:': '🏴󠁧󠁢󠁷󠁬󠁳󠁿'
    };

    let result = text;
    for (const [code, emoji] of Object.entries(emojiMap)) {
        result = result.replace(new RegExp(code, 'g'), emoji);
    }
    
    return result;
}

export function initializeElements() {
    const elementIds = [

        // Core Chat
        'chat-container', 'chat-history', 'chat-form', 'chat-input', 'model-select', 'personality-select',
        'status-bar', 'thinking-modal', 'thinking-content', 'close-thinking-btn', 'show-thinking-btn',
        'personality-display-name', 'attach-file-btn', 'attached-file-display', 'slash-command-btn', 'ctrl-enter-toggle',
        'account-btn',
        'sign-content-btn',

        // Token Manager & Canvas
        'model-context-window', 'system-reserve', 'total-user-budget', 'model-display-name', 'model-cost-display',
        'send-cost-display', 'send-cost-tokens', 'send-cost-usd', 'input-token-estimate',
        'output-limit-slider', 'output-limit-input', 'knowledge-rag-slider', 'knowledge-rag-input',
        'history-rag-slider', 'history-rag-input', 'reset-all-btn', 'reset-input-btn', 'reset-output-btn',
        'context-canvas-details', 'canvas-summary-text', 'canvas-summary-tokens', 'canvas-display-area',
        'add-to-canvas-btn', 'clear-canvas-btn', 'context-files-list',

        // Theme Controls
        'theme-controls-container-sidebar',
        'theme-btn',
        'theme-settings-modal',
        'close-theme-settings-btn', 
        'theme-toggle-modal-btn',
        'theme-color-modal-btn',
        'theme-reset-modal-btn',
        'color-picker-modal', 'color-picker-ui', 'color-picker-input', 'color-picker-confirm-btn', 'color-picker-cancel-btn',
        'theme-log-container', 'theme-log', 'theme-log-close-btn',

        // Personalities Manager
        'manage-personalities-btn', 'manage-personalities-modal', 'personalities-list', 'add-personality-btn',
        'close-manage-personalities-btn', 'add-edit-personality-modal', 'modal-title', 'personality-name', 'personality-text', 'token-limit',
        'save-personality-btn', 'cancel-personality-btn',

        // Prompts Manager
        'prompt-manager-btn', 'manage-prompts-modal', 'prompts-list', 'add-prompt-btn', 'close-manage-prompts-btn',
        'add-edit-prompt-modal', 'prompt-modal-title', 'prompt-name', 'prompt-text', 'save-prompt-btn', 'cancel-prompt-btn',
        'tab-free-prompt', 'tab-template-prompt', 'free-prompt-content', 'template-prompt-content',
        'template-prompt-name', 'template-role', 'template-instruction', 'template-data', 'template-output',
        'prompt-type-select', 'chat-prompt-container', 'image-prompt-container', 'video-prompt-container', 'modifier-prompt-container',
        'modifier-name', 'modifier-text', 'modifier-prompt-container',
        'editing-prompt-id',

        // Actions Manager
        'action-manager-btn', 'manage-actions-modal', 'actions-list', 'add-action-btn', 'close-manage-actions-btn',
        'add-edit-action-modal', 'action-modal-title', 'action-name', 'action-text', 'action-style', 'custom-style-input', 'action-custom-style',
        'save-action-btn', 'cancel-action-btn',

        // Memories & Knowledge 
        'view-memories-btn', 
        'view-knowledge-files-btn', 
        'clear-knowledge-btn', 
        'clear-history-btn',

        // App Manager & Output 
        'ingestion-overlay', 'ingestion-log', 'ingestion-close-container', 'view-history-btn',
        
        // Output Folder Management
        'open-output-folder-btn', 
        'open-images-folder-btn', 
        'open-videos-folder-btn', 
        'open-conversions-folder-btn',
        'open-exa-folder-btn',
        'open-scrapy-folder-btn',
        'clear-all-output-btn', 
        
        // File Conversion Tools
        'open-file-converter-btn',
        
        // Knowledge Management
        'ingest-files-btn', 
        'ingest-folder-btn', 

        // Scrapy Suite
        'power-scrape-btn', 'scrapy-modal', 'scrapy-close-btn', 'scrapy-url-input', 'scrape-mode-links', 'scrape-mode-content', 'scrapy-start-btn', 'scrapy-log',

        // Slash Command Modal
        'slash-command-modal', 'slash-command-close-btn', 'slash-command-options', 'slash-command-details', 'slash-command-input', 'slash-command-execute-btn',
        'slash-command-save-btn', 'slash-command-chat-btn', 'slash-command-save-and-chat-btn', 'slash-command-save-buttons', 'slash-command-action-buttons',
        'research-query-input',
        'research-num-results',
        'research-start-date',
        'research-domain-includes',
        'research-domain-excludes',
        'research-execute-btn',

        // Object Creator
        'create-object-btn', 'insert-object-btn', 'create-object-modal', 'cancel-object-btn', 'object-input-textarea',
        
        // Image Gen Modal
        'generate-image-btn', 'image-gen-modal', 'image-gen-close-btn', 'image-gen-cancel-btn', 'image-model-select', 'image-prompt',
        'image-negative-prompt', 'steps-slider', 'steps-value', 'image-aspect-ratio',
        'guidance-scale-slider', 'guidance-scale-value', 'disable-safety-checker-toggle',
        'generate-image-btn-submit', 'image-gen-log', 'image-previews-container', 
        'open-image-output-btn', 
        'tab-image-t2i', 
        'tab-image-i2i', 

        // Clear Confirmation Modal Elements
        'clear-confirm-modal', 'clear-modal-title', 'clear-modal-message', 'confirm-clear-action-btn', 'cancel-clear-action-btn',

        // --- GENERATIVE MODALS ---
        'generate-selfie-btn', 'selfie-gen-modal', 'selfie-prompt-input', 'selfie-gen-submit-btn', 'selfie-gen-cancel-btn',
        'generate-selfie-video-btn', 
        'video-gen-modal', 
        'attire-prompt-input-video', 
        'video-prompt-input', 
        'video-gen-submit-btn', 
        'video-gen-cancel-btn',
        'open-selfie-video-output-btn', 

        // --- ADVANCED VIDEO MODAL ---
        'generate-advanced-video-btn', 
        'advanced-video-gen-modal',
        'advanced-video-gen-close-btn',
        'advanced-video-gen-cancel-btn',
        'tab-video-t2v', 
        'tab-video-i2v', 
        'advanced-video-model-select',
        'advanced-video-prompt',
        'advanced-video-negative-prompt',
        'advanced-video-aspect-ratio',
        'advanced-video-steps-slider',
        'advanced-video-steps-value',
        'advanced-video-guidance-scale-slider',
        'advanced-video-guidance-scale-value',
        'advanced-video-frames',
        'advanced-video-i2v-upload-group', 
        'advanced-video-image-upload', 
        'advanced-video-free-payload',
        'generate-advanced-video-btn-submit',
        'advanced-video-gen-log',
        'advanced-video-previews-container',
        'open-video-output-btn',

        // --- DEEPAI STUDIO ---
        'open-deepai-studio-btn', 
    ];
    
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const camelCaseId = id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
            elements[camelCaseId] = element;
            if (id === 'theme-settings-modal') {
                console.log('Theme settings modal element found and initialized as:', camelCaseId);
            }
        } else if (id === 'theme-settings-modal') {
            console.warn('Theme settings modal element not found in DOM');
        }
    });

    elements.personaSelect = document.getElementById('personality-select');
}

export function addMessage(message, sender, attachmentName = null, isImage = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    if (sender === 'ai') {
        const avatarElement = document.createElement('img');
        avatarElement.className = 'ai-avatar';
        avatarElement.style.cssText = `
            width: 50px; 
            height: 50px; 
            border-radius: 50%; 
            margin-right: 10px; 
            align-self: flex-start;
        `;
        messageElement.appendChild(avatarElement);
        
        updateCharacterIcon();
    }

    const messageContentWrapper = document.createElement('div');
    messageContentWrapper.style.display = 'flex';
    messageContentWrapper.style.flexDirection = 'column';
    messageContentWrapper.style.width = '100%'; 

    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');

    if (isImage) {
        contentElement.innerHTML = message;
    } else if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
        const processedMessage = convertEmojiCodes(message || '');
        const rawHtml = marked.parse(processedMessage);
        contentElement.innerHTML = DOMPurify.sanitize(rawHtml);
        
        setTimeout(() => {
            if (typeof hljs !== 'undefined') {
                contentElement.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            }
        }, 0);
        
    } else {
        contentElement.textContent = message || '';
    }

    messageContentWrapper.appendChild(contentElement);

    if (attachmentName) {
        const attachmentElement = document.createElement('div');
        attachmentElement.classList.add('attachment-indicator');
        const icon = isImage ? '🖼️' : '📎';
        attachmentElement.textContent = `${icon} ${attachmentName}`;
        messageContentWrapper.appendChild(attachmentElement);
    }
    
    messageElement.appendChild(messageContentWrapper);
    
    elements.chatHistory.appendChild(messageElement);
    elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;

    const MAX_MESSAGES_IN_DOM = 50;
    while (elements.chatHistory.children.length > MAX_MESSAGES_IN_DOM) {
        elements.chatHistory.firstChild.remove();
    }
    return messageElement;
}

export function addMessageRaw(message, sender, attachmentName = null) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    const messageContentWrapper = document.createElement('div');
    messageContentWrapper.style.display = 'flex';
    messageContentWrapper.style.flexDirection = 'column';
    messageContentWrapper.style.width = '100%'; 

    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');

    contentElement.innerHTML = DOMPurify.sanitize(message);

    setTimeout(() => {
        if (typeof hljs !== 'undefined') {
            contentElement.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    }, 0);

    messageContentWrapper.appendChild(contentElement);

    if (attachmentName) {
        const attachmentElement = document.createElement('div');
        attachmentElement.classList.add('attachment-indicator');
        attachmentElement.textContent = `📎 ${attachmentName}`;
        messageContentWrapper.appendChild(attachmentElement);
    }
    
    messageElement.appendChild(messageContentWrapper);
    
    elements.chatHistory.appendChild(messageElement);
    elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;

    const MAX_MESSAGES_IN_DOM = 50;
    while (elements.chatHistory.children.length > MAX_MESSAGES_IN_DOM) {
        elements.chatHistory.firstChild.remove();
    }
    return messageElement;
}


export async function updateCanvasDisplay(contextCanvasFiles, estimateTokens) {
    const allCanvasContent = Object.values(contextCanvasFiles).join('');
    const totalCanvasTokens = await estimateTokens(allCanvasContent);
    elements.canvasSummaryText.textContent = Object.keys(contextCanvasFiles).length ? `${Object.keys(contextCanvasFiles).length} Files` : 'None';
    elements.canvasSummaryTokens.textContent = totalCanvasTokens.toLocaleString();
    
    const fileTagsPromises = Object.keys(contextCanvasFiles).map(async (filename) => {
        const fileContent = contextCanvasFiles[filename];
        const fileTokens = await estimateTokens(fileContent);
        return `<span class="context-file-tag">${filename} (~${fileTokens.toLocaleString()} tokens)<button class="remove-file-btn" data-filename="${filename}">&times;</button></span>`;
    });
    const fileTags = (await Promise.all(fileTagsPromises)).join('');
    elements.contextFilesList.innerHTML = fileTags || "None";
}

export function showStatusMessage(message, type = 'success', duration = 4000) {
    if (!elements.statusBar) return;
    elements.statusBar.textContent = message;
    elements.statusBar.className = `status-bar ${type}`;
    elements.statusBar.classList.remove('hidden');

    setTimeout(() => {
        elements.statusBar.classList.add('hidden');
    }, duration);
}

export function updateSendCostDisplay(userInputTokens, attachmentTokens, canvasTokens, modelCostPerToken) {
    const totalSendTokens = userInputTokens + attachmentTokens + canvasTokens;
    const estimatedUsdCost = totalSendTokens * (modelCostPerToken.input / 1000000);

    if(elements.sendCostTokens) elements.sendCostTokens.textContent = `~${totalSendTokens.toLocaleString()}`;
    if(elements.sendCostUsd) elements.sendCostUsd.textContent = `(~$${estimatedUsdCost.toFixed(6)})`;
}

export function updateUserBudgetUI(modelContextWindow, systemReserve, settings) {
    if (!elements.totalUserBudget) return;
    const userBudget = modelContextWindow - systemReserve - settings.output - settings.knowledge - settings.history;
    elements.totalUserBudget.textContent = userBudget.toLocaleString();
}

export function applyPalette(palette) {
    if (!palette) return;
    for (const key in palette) {
        document.body.style.setProperty(`--${key}`, palette[key]);
    }
}

export function clearIngestionLog() {
    if(elements.ingestionOverlay) elements.ingestionOverlay.classList.add('hidden');
    if(elements.ingestionLog) elements.ingestionLog.textContent = '';
    const closeBtn = document.getElementById('ingestion-close-btn');
    if (closeBtn) closeBtn.remove();
}

export function updateTokenDisplay(inputTokens) {
    if(elements.inputTokenEstimate) elements.inputTokenEstimate.textContent = inputTokens.toLocaleString();
}

export function showConfirmationModal(title, message, onConfirm) {
    if (!elements.clearConfirmModal) {
        console.error('Confirmation modal element not found');
        return;
    }
    
    // Set the modal content
    if (elements.clearModalTitle) elements.clearModalTitle.textContent = title;
    if (elements.clearModalMessage) elements.clearModalMessage.textContent = message;
    
    // Show the modal
    elements.clearConfirmModal.classList.remove('hidden');
    
    // Set up event listeners for the buttons
    const confirmBtn = elements.confirmClearActionBtn;
    const cancelBtn = elements.cancelClearActionBtn;
    
    if (confirmBtn) {
        // Remove any existing event listeners to avoid duplicates
        confirmBtn.onclick = null;
        confirmBtn.onclick = () => {
            elements.clearConfirmModal.classList.add('hidden');
            if (onConfirm && typeof onConfirm === 'function') {
                onConfirm();
            }
        };
    }
    
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            elements.clearConfirmModal.classList.add('hidden');
        };
    }
}


export function insertTextAtCaret(element, text) { 
    element.focus();
    const selection = window.getSelection();
    
    if (selection.rangeCount === 0) {
        element.textContent += text;
        return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
}


export async function updateCharacterIcon() {
    try {
        const iconPath = await window.electronAPI.getActiveCharacterIcon();
        const avatars = document.querySelectorAll('.ai-avatar');
        avatars.forEach(img => {
            if (iconPath && typeof iconPath === 'string') {
                img.src = iconPath;
            }
        });
        const headerAvatar = document.getElementById('character-avatar');
        if (headerAvatar && iconPath) {
            headerAvatar.src = iconPath;
        }
    } catch (err) {
        console.warn('Failed to update character icon:', err);
    }
}