export default async function ContactUsPage() {

    const handleSubmit = async (form: FormData) => {
        "use server"
        // Handle your form submission logic here
        console.log(form);
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="bg-white p-8 rounded-lg shadow-xl w-1/2">
                <h2 className="text-2xl font-bold mb-6 text-teal-500 border-b pb-2">Contact Us</h2>
                <form action={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-teal-500 text-sm font-bold mb-2" htmlFor="name">
                            Name
                        </label>
                        <input type="text" name="name" id="name" placeholder="Your Name" className="input input-bordered w-full max-w-full" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-teal-500 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input type="text" name="email"  id="email" placeholder="Your Email" className="input input-bordered w-full max-w-full" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-teal-500 text-sm font-bold mb-2" htmlFor="message">
                            Message
                        </label>
                        <textarea className="textarea textarea-bordered w-full" name="message" id="message" placeholder="Your Message"></textarea>
                    </div>
                    <div className="flex items-center justify-between">
                        <button className="btn" type="submit">
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}