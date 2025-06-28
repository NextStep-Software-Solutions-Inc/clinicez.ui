import { Button } from "@components/ui/button";
import Link from "next/link";

interface OrganizationStepCompleteProps {
    startOver: () => void;
  }
export default function OrganizationStepComplete(props: OrganizationStepCompleteProps) {
  const { startOver } = props;
  return (
    <>
      <div className="shadow-2xl p-10 rounded-md">
        <div className="text-center min-w-full my-10 space-y-5">
          <h2 className="text-2xl font-bold ">Application Sent! 🎉</h2>
          <p>
          Your application has been successfully sent to the organization. You will be notified once your application has been reviewed.
          </p>
          <Button onClick={startOver} className="my-5">Apply another role</Button>
          <Link href="/" className="" legacyBehavior>
            <Button variant="link" className="my-5">Go Home</Button>
          </Link>
        </div>
      </div>
    </>
  );
};
  