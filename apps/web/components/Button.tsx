'use client'

import { useRouter } from "next/navigation"

type ButtonProp ={
    classNameInputs? : string,
    onClick?: string
  buttonInput: string
    action: string
}

export default function ButtonComponent({classNameInputs , onClick , buttonInput , action } : ButtonProp){
    const router = useRouter()
    console.log("nav to" , onClick)
    return (
      <button onClick={() => {
        if (action === 'push')
          router.push(`${onClick}`)
        else if (action === 'replace')
          router.replace(`${onClick}`)
        else if (action === 'back')
          router.back();
      }
        } className={`${classNameInputs}`}>{buttonInput}</button>
    )
}
