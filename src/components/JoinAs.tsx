import Link, {LinkProps} from "next/link";
import React from "react";

interface JoinAsButtonProps extends LinkProps {
}

export default function JoinAsButton(props: JoinAsButtonProps) {
  return (
    <Link 
      className='sticky bottom-5 mt-5'
      {...props}
    >
      <div  className="bg-teal-500 text-white font-semibold py-4 px-14 rounded-lg shadow-lg hover:scale-150 hover:bg-teal-600 cursor-pointer animate-bounce" 
      >Join Us</div>
    </Link>
  );
}
