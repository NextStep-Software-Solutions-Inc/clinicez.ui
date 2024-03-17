import { withPageAuthRequired } from "@auth0/nextjs-auth0"

async function JoinOrganizationPage() {
  return (
    <div>JoinOrganizationPage</div>
  )
}

export default withPageAuthRequired(JoinOrganizationPage)
