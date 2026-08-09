import BetaAccessGate from "@/components/auth/beta-access-gate";
import EstimatorShell from "@/components/estimator/shell";
import PwaManager from "@/components/pwa/pwa-manager";

export default function EstimatorApplicationPage() {
  return (
    <>
      <PwaManager />
      <BetaAccessGate>
        <EstimatorShell />
      </BetaAccessGate>
    </>
  );
}
