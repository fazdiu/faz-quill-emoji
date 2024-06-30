import icons from './icons';

// @see https://icon-sets.iconify.design/mdi
export default [
    {
        icon: icons.others,
        name: 'others',
        order: 10,
        otherNames: ['Extras Openmoji','extras unicode'],
        default: true
    },
    {
        icon: icons.smiley,
        name: 'smileys emotion',
        order: 1,
        otherNames: ['people', 'smileys & emotion']
    },
    {
        icon: icons.people,
        name: 'people body',
        order: 1.1,
        otherNames: ['people & body']
    },
    {
        icon: icons.food,
        name: 'food',
        otherNames: ['food drink', 'food & drink'],
        order: 2,
    },

    {
        icon: icons.travel,
        name: 'travel',
        order: 3,
        otherNames: ['travel places', 'Travel & places']
    },
    {
        icon: icons.objects,
        name: 'objects',
        order: 4,
        otherNames: []
    },
    {
        icon: icons.activity,
        name: 'activity',
        order: 5,
        otherNames: ['Activities']
    },
    {
        icon: icons.animals,
        order: 6,
        name: 'animals',
        otherNames: ['nature', 'Animals nature', 'Animals & nature', 'Animals & places']
    },
    {
        icon: icons.flags,
        name: 'flags',
        order: 7,
        otherNames: []
    },
    {
        icon: icons.symbols,
        name: 'symbols',
        order: 8,
        otherNames: []
    }
]