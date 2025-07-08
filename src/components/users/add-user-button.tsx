'use client';

import { motion } from 'framer-motion';

export interface AddUserButtonProps {
    onAddUser: () => void;
}

export function AddUserButton({ onAddUser }: AddUserButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddUser}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
            Add User
        </motion.button>
    );
}
 