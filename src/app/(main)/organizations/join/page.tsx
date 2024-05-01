import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0"

async function JoinOrganizationPage(props: AppRouterPageRouteOpts) {
  return (
    <div className="container mx=auto">
      <div>JoinOrganizationPage</div>

    </div>
  )
}

export default withPageAuthRequired(JoinOrganizationPage, {
  returnTo: '/organizations/join',
})
