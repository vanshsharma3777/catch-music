"use client";
import { motion } from "motion/react";

type BlobPurpleAnimationProps = {
    classNameInputs: string;
};

export default function BlobPurpleAnimation({ classNameInputs }: BlobPurpleAnimationProps) {
    return (
        <>
            <motion.div
                style={{
                    transformOrigin: "top left",
                }}
                initial={{
                    opacity: 0,
                    scale: 0.8,
                }}
                animate={{
                    opacity: 1,
                    scale: 1,
                }}
                transition={{
                    duration: 1.5,
                    ease: "easeInOut",
                }}
                className={`${classNameInputs}`}
            />
        </>
    )
}