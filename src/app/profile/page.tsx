import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";
import dayjs from "dayjs";

const Profile = async () => {
    const session = await getSession();
    const user = session?.user;

    return (
        <div className="flex flex-col items-center justify-centerp-4">
            <div className="my-5 rounded overflow-hidden shadow-xl bg-white p-5">
                <img className="w-full h-64 object-cover" src={user?.picture} alt={user?.name} />
                <div className="px-6 py-4">
                    <div className="font-bold text-xl mb-2">{user?.name}</div>
                    <p className="text-gray-700 text-base">{user?.email}</p>
                    <p className="text-gray-700 text-base">Email Verified: {user?.email_verified ? 'Yes' : 'No'}</p>
                    <p className="text-gray-700 text-base">Nickname: {user?.nickname}</p>
                    <p className="text-gray-700 text-base">Sub: {user?.sub}</p>
                    <p className="text-gray-700 text-base">Updated At: {dayjs(user?.updated_at).format("dddd MMM. DD, YYYY hh:mm A")}</p>
                    <p className="text-gray-700 text-base">Org ID: {user?.org_id}</p>
                </div>
            </div>
        </div>
    );
};

export default withPageAuthRequired(Profile);