import DeploymentDetails from './DeploymentDetails';

export default function DeploymentDetailsPage({ params }: { params: { deploymentId: string } }) {
  return <DeploymentDetails id={params.deploymentId} />;
}
