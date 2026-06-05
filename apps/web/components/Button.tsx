'use client'

import { useRouter } from "next/navigation"

type ButtonProp ={
    classNameInputs? : string,
    onClick?: string
    buttonInput: string
}

export default function ButtonComponent({classNameInputs , onClick , buttonInput } : ButtonProp){
    const router = useRouter()

    return (
        <button onClick={()=>{
            router.push(`${onClick}`)
        }
        } className={`${classNameInputs}`}>{buttonInput}</button>
    )
}