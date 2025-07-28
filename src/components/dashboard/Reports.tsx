import ConditionalRender from "../utils/ConditionalRender";

export const Reports = async ({ clinicUid }: { clinicUid: string }) => {

  return (
    <ConditionalRender condition={true}>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Reports</h2>
        <p>Reports functionality is under development.</p>
      </div>
    </ConditionalRender>
  );
}