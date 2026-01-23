import { useEffect, useState } from "react";

type HealthStatus = "checking" | "ok" | "warning";

interface HealthCheckResult {
  name: string;
  ok: boolean;
  expected: string;
  actual: string;
}

interface HealthDetails {
  tokenPrimary: string;
  checks: HealthCheckResult[];
}

const isTransparent = (value: string) =>
  value === "transparent" || value === "rgba(0, 0, 0, 0)";

const withTestElement = (
  className: string,
  run: (el: HTMLElement) => string,
  skipInlineStyles = false,
) => {
  const sample = document.createElement("div");
  sample.className = className;
  // Só aplica estilos inline se não for para verificar position ou inset
  if (!skipInlineStyles) {
    sample.style.position = "absolute";
    sample.style.left = "-9999px";
    sample.style.visibility = "hidden";
  }
  document.body.appendChild(sample);
  const actual = run(sample);
  document.body.removeChild(sample);
  return actual;
};

const buildChecks = (): HealthCheckResult[] => {
  const checks: HealthCheckResult[] = [];

  const primaryBgColor = withTestElement("bg-primary-600", (el) => {
    return getComputedStyle(el).backgroundColor;
  });
  checks.push({
    name: "bg-primary-600",
    ok: !!primaryBgColor && !isTransparent(primaryBgColor),
    expected: "background-color != transparent",
    actual: primaryBgColor || "(missing)",
  });

  const fixedPosition = withTestElement("fixed", (el) => {
    return getComputedStyle(el).position;
  }, true); // Não aplica estilos inline para não interferir no position
  checks.push({
    name: "fixed",
    ok: fixedPosition === "fixed",
    expected: "position: fixed",
    actual: fixedPosition || "(missing)",
  });

  const inset = withTestElement("inset-0", (el) => {
    const styles = getComputedStyle(el);
    return `${styles.top} ${styles.right} ${styles.bottom} ${styles.left}`;
  }, true); // Não aplica estilos inline para não interferir no inset
  checks.push({
    name: "inset-0",
    ok: inset === "0px 0px 0px 0px",
    expected: "top/right/bottom/left: 0px",
    actual: inset || "(missing)",
  });

  const zIndex = withTestElement("z-50", (el) => {
    return getComputedStyle(el).zIndex;
  });
  checks.push({
    name: "z-50",
    ok: zIndex === "50",
    expected: "z-index: 50",
    actual: zIndex || "(missing)",
  });

  const backdrop = withTestElement("bg-black/50", (el) => {
    return getComputedStyle(el).backgroundColor;
  });
  checks.push({
    name: "bg-black/50",
    ok: backdrop.includes("0.5") || backdrop === "rgba(0, 0, 0, 0.5)",
    expected: "background-color: rgba(0, 0, 0, 0.5)",
    actual: backdrop || "(missing)",
  });

  const rounded = withTestElement("rounded-lg", (el) => {
    return getComputedStyle(el).borderRadius;
  });
  checks.push({
    name: "rounded-lg",
    ok: rounded !== "0px",
    expected: "border-radius > 0",
    actual: rounded || "(missing)",
  });

  const shadow = withTestElement("shadow-xl", (el) => {
    return getComputedStyle(el).boxShadow;
  });
  checks.push({
    name: "shadow-xl",
    ok: shadow !== "none",
    expected: "box-shadow != none",
    actual: shadow || "(missing)",
  });

  // Para w-full, precisa estar no fluxo normal (não absolute)
  const widthSample = document.createElement("div");
  widthSample.className = "w-full";
  widthSample.style.visibility = "hidden";
  document.body.appendChild(widthSample);
  const width = getComputedStyle(widthSample).width;
  document.body.removeChild(widthSample);
  
  // w-full computado será em px quando o elemento está no body
  // Verifica se é aproximadamente a largura do viewport (com margem de erro de 20px)
  const viewportWidth = window.innerWidth;
  const widthPx = width ? parseFloat(width.replace("px", "")) : 0;
  const isFullWidth = width === "100%" || 
    (widthPx > 0 && Math.abs(widthPx - viewportWidth) < 20);
  checks.push({
    name: "w-full",
    ok: isFullWidth,
    expected: "width: 100% (ou ~viewport width)",
    actual: width || "(missing)",
  });

  const maxWidth = withTestElement("max-w-lg", (el) => {
    return getComputedStyle(el).maxWidth;
  });
  checks.push({
    name: "max-w-lg",
    ok: maxWidth !== "none",
    expected: "max-width != none",
    actual: maxWidth || "(missing)",
  });

  const maxHeight = withTestElement("max-h-[90vh]", (el) => {
    return getComputedStyle(el).maxHeight;
  });
  // max-h-[90vh] computado será em px
  // Verifica se é aproximadamente 90% da altura do viewport (com margem de erro de 20px)
  const viewportHeight = window.innerHeight;
  const expectedMaxHeight = viewportHeight * 0.9;
  const maxHeightPx = maxHeight ? parseInt(maxHeight) : 0;
  const isCorrectMaxHeight = maxHeight === "90vh" || 
    (maxHeightPx > 0 && Math.abs(maxHeightPx - expectedMaxHeight) < 20);
  checks.push({
    name: "max-h-[90vh]",
    ok: isCorrectMaxHeight,
    expected: "max-height: 90vh (ou ~90% viewport height)",
    actual: maxHeight || "(missing)",
  });

  const overflowY = withTestElement("overflow-y-auto", (el) => {
    return getComputedStyle(el).overflowY;
  });
  checks.push({
    name: "overflow-y-auto",
    ok: overflowY === "auto",
    expected: "overflow-y: auto",
    actual: overflowY || "(missing)",
  });

  return checks;
};

const DesignSystemHealthCheck = () => {
  const [status, setStatus] = useState<HealthStatus>("checking");
  const [details, setDetails] = useState<HealthDetails | null>(null);

  useEffect(() => {
    const tokenPrimary = getComputedStyle(
      document.documentElement,
    ).getPropertyValue("--color-primary-600");
    const checks = buildChecks();
    const hasToken = tokenPrimary.trim().length > 0;
    const allOk = hasToken && checks.every((check) => check.ok);

    setDetails({
      tokenPrimary: tokenPrimary.trim(),
      checks,
    });
    setStatus(allOk ? "ok" : "warning");
  }, []);

  if (!details) {
    return null;
  }

  const baseClasses =
    "fixed bottom-4 right-4 z-[9999] rounded-lg border px-3 py-2 text-xs shadow-md";

  if (status === "ok") {
    return (
      <div className={`${baseClasses} border-success-200 bg-success-50 text-success-800`}>
        Design system OK
      </div>
    );
  }

  const failedChecks = details.checks.filter((check) => !check.ok);

  return (
    <div className={`${baseClasses} border-warning-200 bg-warning-50 text-warning-900`}>
      <div className="font-semibold">Design system warning</div>
      <div className="mt-1">
        --color-primary-600: {details.tokenPrimary || "(missing)"}
      </div>
      {failedChecks.length === 0 ? (
        <div>All class checks passed.</div>
      ) : (
        <div className="mt-1 space-y-1">
          {failedChecks.map((check) => (
            <div key={check.name}>
              {check.name}: {check.actual}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DesignSystemHealthCheck;
