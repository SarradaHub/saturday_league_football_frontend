/**
 * Design System Audit Tool
 * 
 * Valida em tempo de execução (DEV) se todas as classes do design system
 * estão sendo geradas corretamente pelo Tailwind e se não estão sendo
 * sobrescritas por estilos da aplicação.
 */

interface ClassCheckResult {
  className: string;
  exists: boolean;
  overridden: boolean;
  expectedValue?: string;
  actualValue?: string;
  elements?: Array<{
    selector: string;
    property: string;
    expected: string;
    actual: string;
  }>;
}

interface AuditResult {
  missingClasses: ClassCheckResult[];
  overriddenClasses: ClassCheckResult[];
  allClassesChecked: number;
  passedChecks: number;
}

// Lista de classes críticas do design system extraídas dos componentes
const DESIGN_SYSTEM_CLASSES = {
  // Colors - Primary
  primary: [
    'bg-primary-600',
    'bg-primary-700',
    'bg-primary-800',
    'bg-primary-300',
    'bg-primary-50',
    'bg-primary-100',
    'bg-primary-900/20',
    'text-primary-600',
    'text-primary-400',
    'border-primary-500',
    'hover:bg-primary-700',
    'hover:bg-primary-50',
    'hover:bg-primary-100',
    'hover:bg-primary-900/20',
    'focus:ring-primary-500',
    'active:bg-primary-800',
    'active:bg-primary-100',
  ],
  // Colors - Secondary/Neutral
  neutral: [
    'bg-neutral-200',
    'bg-neutral-300',
    'bg-neutral-400',
    'bg-neutral-700',
    'bg-neutral-800',
    'bg-neutral-900',
    'bg-neutral-100',
    'text-neutral-900',
    'text-neutral-100',
    'text-neutral-300',
    'text-neutral-400',
    'text-neutral-600',
    'text-neutral-700',
    'border-neutral-200',
    'border-neutral-300',
    'border-neutral-500',
    'border-neutral-600',
    'border-neutral-700',
    'hover:bg-neutral-300',
    'hover:bg-neutral-100',
    'hover:bg-neutral-600',
    'hover:bg-neutral-800',
    'hover:text-neutral-600',
    'hover:text-neutral-300',
    'focus:ring-neutral-500',
    'active:bg-neutral-400',
    'active:bg-neutral-200',
    'dark:bg-neutral-700',
    'dark:bg-neutral-800',
    'dark:text-neutral-100',
    'dark:text-neutral-300',
    'dark:border-neutral-700',
    'dark:hover:bg-neutral-600',
    'dark:hover:text-neutral-300',
    'dark:hover:bg-neutral-800',
  ],
  // Colors - Error
  error: [
    'bg-error-600',
    'bg-error-700',
    'bg-error-800',
    'bg-error-300',
    'text-error-500',
    'text-error-600',
    'text-error-400',
    'border-error-500',
    'hover:bg-error-700',
    'focus:ring-error-500',
    'active:bg-error-800',
  ],
  // Layout & Positioning
  layout: [
    'fixed',
    'absolute',
    'relative',
    'inset-0',
    'inset-x-0',
    'top-0',
    'z-50',
    'z-[9999]',
    'flex',
    'items-center',
    'justify-center',
    'w-full',
    'h-full',
    'max-w-md',
    'max-w-lg',
    'max-w-2xl',
    'max-w-4xl',
    'max-w-full',
    'max-h-[90vh]',
    'p-4',
    'p-6',
    'px-3',
    'px-4',
    'px-6',
    'py-1.5',
    'py-2',
    'py-3',
    'mx-4',
  ],
  // Visual Effects
  effects: [
    'bg-black/50',
    'backdrop-blur-sm',
    'rounded-lg',
    'shadow-xl',
    'shadow-md',
    'border',
    'border-b',
    'overflow-y-auto',
    'opacity-50',
    'pointer-events-none',
  ],
  // Typography
  typography: [
    'text-sm',
    'text-base',
    'text-lg',
    'text-xl',
    'font-medium',
    'font-semibold',
    'text-white',
  ],
  // States
  states: [
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'focus:border-transparent',
    'disabled:opacity-50',
    'disabled:pointer-events-none',
    'disabled:bg-primary-300',
    'disabled:bg-error-300',
    'disabled:bg-neutral-100',
    'disabled:text-neutral-500',
    'disabled:cursor-not-allowed',
    'transition-colors',
    'ml-auto',
    'gap-1.5',
    'gap-2',
    'gap-2.5',
    'animate-spin',
  ],
  // Utilities
  utilities: [
    'inline-flex',
    'block',
    'space-y-1',
    'space-y-2',
  ],
};

const getAllClasses = (): string[] => {
  return Object.values(DESIGN_SYSTEM_CLASSES).flat();
};

const checkClassExists = (className: string): boolean => {
  // Cria elemento temporário para testar se a classe existe no CSS
  const testEl = document.createElement('div');
  testEl.className = className;
  testEl.style.position = 'absolute';
  testEl.style.left = '-9999px';
  testEl.style.visibility = 'hidden';
  document.body.appendChild(testEl);
  
  const computed = getComputedStyle(testEl);
  const hasStyles = Array.from(computed).some((prop) => {
    const value = computed.getPropertyValue(prop);
    return value && value !== 'initial' && value !== 'normal';
  });
  
  document.body.removeChild(testEl);
  return hasStyles;
};

const hasSpecialCharacters = (className: string): boolean => {
  // Verifica se a classe contém caracteres que não são válidos em seletores CSS
  return /[\/\[\]]/.test(className);
};

const findElementsWithClass = (className: string): Element[] => {
  // Remove pseudo-classes e variants para buscar elementos
  let baseClass = className.split(':')[0];
  
  // Remove arbitrary values como [90vh]
  baseClass = baseClass.replace(/\[.*?\]/g, '');
  
  // Se a classe contém caracteres especiais, não tenta buscar no DOM
  // (classes como bg-primary-900/20 não podem ser usadas em querySelector)
  if (hasSpecialCharacters(baseClass)) {
    return [];
  }
  
  try {
    // Escapa caracteres especiais restantes
    const escaped = baseClass.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');
    return Array.from(document.querySelectorAll(`.${escaped}`));
  } catch (e) {
    // Se ainda falhar, retorna array vazio
    return [];
  }
};

const checkClassOverridden = (
  className: string,
  elements: Element[],
): ClassCheckResult['elements'] => {
  const issues: ClassCheckResult['elements'] = [];
  
  // Para classes de cor, verifica se o valor computado corresponde ao esperado
  if (className.startsWith('bg-')) {
    const testEl = document.createElement('div');
    testEl.className = className;
    testEl.style.position = 'absolute';
    testEl.style.left = '-9999px';
    document.body.appendChild(testEl);
    const expected = getComputedStyle(testEl).backgroundColor;
    document.body.removeChild(testEl);
    
    // Verifica elementos reais no DOM
    elements.forEach((el) => {
      const actual = getComputedStyle(el).backgroundColor;
      if (actual && expected && actual !== expected && actual !== 'rgba(0, 0, 0, 0)') {
        const path = getElementPath(el);
        issues.push({
          selector: path,
          property: 'backgroundColor',
          expected,
          actual,
        });
      }
    });
  } else if (className.includes('rounded-')) {
    const testEl = document.createElement('div');
    testEl.className = className;
    testEl.style.position = 'absolute';
    testEl.style.left = '-9999px';
    document.body.appendChild(testEl);
    const expected = getComputedStyle(testEl).borderRadius;
    document.body.removeChild(testEl);
    
    elements.forEach((el) => {
      const actual = getComputedStyle(el).borderRadius;
      if (actual && expected && actual !== expected && actual !== '0px') {
        const path = getElementPath(el);
        issues.push({
          selector: path,
          property: 'borderRadius',
          expected,
          actual,
        });
      }
    });
  }
  
  return issues.length > 0 ? issues : undefined;
};

const getElementPath = (el: Element): string => {
  const path: string[] = [];
  let current: Element | null = el;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += `#${current.id}`;
    } else if (current.className) {
      const classes = Array.from(current.classList).slice(0, 2).join('.');
      if (classes) selector += `.${classes}`;
    }
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
};

const auditDesignSystem = (): AuditResult => {
  const allClasses = getAllClasses();
  const missingClasses: ClassCheckResult[] = [];
  const overriddenClasses: ClassCheckResult[] = [];
  
  console.group('🎨 Design System Audit');
  console.log(`Verificando ${allClasses.length} classes...\n`);
  
  allClasses.forEach((className) => {
    try {
      const exists = checkClassExists(className);
      const elements = exists ? findElementsWithClass(className) : [];
      const overrideIssues = exists && elements.length > 0 
        ? checkClassOverridden(className, elements)
        : undefined;
      
      const isOverridden = overrideIssues !== undefined && overrideIssues.length > 0;
      
      if (!exists) {
        missingClasses.push({
          className,
          exists: false,
          overridden: false,
        });
      } else if (isOverridden) {
        overriddenClasses.push({
          className,
          exists: true,
          overridden: true,
          elements: overrideIssues,
        });
      }
    } catch (error) {
      // Ignora erros em classes individuais para não quebrar toda a auditoria
      console.warn(`Erro ao verificar classe ${className}:`, error);
    }
  });
  
  const passedChecks = allClasses.length - missingClasses.length - overriddenClasses.length;
  
  // Log resultados
  if (missingClasses.length > 0) {
    console.group('❌ Classes não encontradas no CSS');
    missingClasses.forEach(({ className }) => {
      console.warn(`  • ${className}`);
    });
    console.groupEnd();
  }
  
  if (overriddenClasses.length > 0) {
    console.group('⚠️ Classes sobrescritas por estilos da aplicação');
    overriddenClasses.forEach(({ className, elements }) => {
      console.warn(`  • ${className}`);
      elements?.forEach((issue) => {
        console.warn(`    → ${issue.selector}`);
        console.warn(`      Esperado: ${issue.expected}`);
        console.warn(`      Atual: ${issue.actual}`);
      });
    });
    console.groupEnd();
  }
  
  if (missingClasses.length === 0 && overriddenClasses.length === 0) {
    console.log('✅ Todas as classes do design system estão funcionando corretamente!');
  }
  
  console.log(`\n📊 Resumo:`);
  console.log(`  • Total verificado: ${allClasses.length}`);
  console.log(`  • OK: ${passedChecks}`);
  console.log(`  • Faltando: ${missingClasses.length}`);
  console.log(`  • Sobrescritas: ${overriddenClasses.length}`);
  console.groupEnd();
  
  return {
    missingClasses,
    overriddenClasses,
    allClassesChecked: allClasses.length,
    passedChecks,
  };
};

export const runDesignSystemAudit = () => {
  if (!import.meta.env.DEV) {
    return;
  }
  
  // Aguarda o DOM estar completamente renderizado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(auditDesignSystem, 1000);
    });
  } else {
    setTimeout(auditDesignSystem, 1000);
  }
};
