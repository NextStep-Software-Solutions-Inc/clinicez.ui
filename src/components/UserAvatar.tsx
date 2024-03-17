"use client";

import { useUser } from "@auth0/nextjs-auth0/client"
import Image from "next/image";

export default function UserAvatar() {

    const {user} = useUser();

    if (!user) return <a href="/api/auth/login" title="" className="px-5 py-2.5 text-base transition-all duration-200 hover:bg-teal-400 hover:text-white focus:text-white focus:bg-teal-400 font-semibold text-white bg-teal-600 rounded-full" role="button"> Join Now </a>
    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar mx-1 ">
                <div className="w-12 mask mask-squircle">
                    <Image width={50} height={50} src={user.picture ?? ""} alt={user.nickname ?? ""}/>
                </div>
            </div>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                <li>
                <a href="/profile" className="justify-between">
                    Profile
                    <span className="badge">New</span>
                </a>
                </li>
                <li><a href="/settings">Settings</a></li>
                <li><a href="https://clinic-ez-admin.vercel.app">Admin Console</a></li>
                <li><a href="/api/auth/logout">Logout</a></li>
            </ul>
        </div>
    )
}
