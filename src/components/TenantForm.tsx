export default function ApplicationForm() {
  const redirectToDashboard = () => {
    window.location.href = "https://clinic-ez-admin.vercel.app/tenants?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySWQiOiI3NDFkNTJhOC1lZTYzLTQ2ZTMtYTE3ZS1mMzJmZmUwY2RiNTkiLCJFbWFpbCI6IndhY2FuYW0yMEBnbWFpbC5jb20iLCJBY2NvdW50VHlwZSI6IjEiLCJuYmYiOjE3MTIzOTE0ODIsImV4cCI6MTcxNDk4ODg4MiwiaWF0IjoxNzEyMzkxNDgyfQ.fNKngLCdsR8MS6utQLBbkU7TUtCmj0NZLxt_dQ8jA8w"; // Redirect to the specified link
  };
  
  return (
    <>
      <div className="text-teal-500 text-3xl font-bold pt-5">You are All Set!</div>
      <p className="text-sm text-gray-500 pt-2 pb-5">Thank you for submitting your application. We will review and get back to you shortly.</p>
      <button className="bg-teal-600 text-white rounded-lg p-3" onClick={redirectToDashboard}>See Dashboard</button>
    </>
  );
}
  