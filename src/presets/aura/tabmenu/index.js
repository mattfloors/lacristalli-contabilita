export default {
    root: {
        class: 'overflow-x-auto'
    },
    menu: {
        class: [
            // Flexbox
            'flex flex-1 gap-2',

            // Spacing
            'list-none',
            'p-1 m-0',
            'rounded-lg',

            // Colors
            'bg-transparent dark:bg-transparent',
            'border-none',
            'text-surface-900 dark:text-surface-0/80'
        ]
    },
    menuitem: {
        class: 'mr-0'
    },
    action: ({ context, state }) => ({
        class: [
            'relative',

            // Font
            'font-semibold leading-none text-sm',

            // Flexbox and Alignment
            'flex items-center',

            // Spacing
            'py-3 px-4',
            '-mb-px',

            // Shape
            'border-none',
            'rounded-md',

            // Colors and Conditions
            {
                'bg-transparent hover:bg-surface-100 dark:hover:bg-surface-800':
                    state.d_activeIndex !== context.index,
                'text-surface-700 dark:text-surface-300': state.d_activeIndex !== context.index,

                'bg-primary-500': state.d_activeIndex === context.index,
                'text-white': state.d_activeIndex === context.index
            },

            // States
            {
                'hover:text-surface-900 dark:hover:text-surface-0':
                    state.d_activeIndex !== context.index
            },

            // Transitions
            'transition-all duration-200',

            // Misc
            'cursor-pointer select-none text-decoration-none',
            'overflow-hidden',
            'user-select-none'
        ]
    }),
    icon: {
        class: 'mr-2'
    }
}
