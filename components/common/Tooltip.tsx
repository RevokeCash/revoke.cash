import {
  arrow,
  autoUpdate,
  FloatingArrow,
  FloatingPortal,
  flip,
  offset,
  type Placement,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole,
  useTransitionStyles,
} from '@floating-ui/react';
import React, {
  type ComponentProps,
  type ForwardedRef,
  forwardRef,
  type HTMLProps,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface TooltipOptions {
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const useTooltip = ({
  placement = 'top',
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: TooltipOptions = {}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const arrowRef = useRef(null);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const data = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(12),
      flip({
        crossAxis: placement.includes('-'),
        fallbackAxisSideDirection: 'start',
        padding: 8,
      }),
      shift({ padding: 8 }),
      arrow({
        element: arrowRef,
        padding: 8,
      }),
    ],
  });

  const context = data.context;

  const hover = useHover(context, {
    move: false,
    handleClose: safePolygon(),
    enabled: controlledOpen == null,
  });
  const focus = useFocus(context, {
    enabled: controlledOpen == null,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const interactions = useInteractions([hover, focus, dismiss, role]);

  return useMemo(
    () => ({
      open,
      setOpen,
      arrowRef,
      ...interactions,
      ...data,
    }),
    [open, setOpen, interactions, data],
  );
};

type ContextType = ReturnType<typeof useTooltip> | null;

const TooltipContext = React.createContext<ContextType>(null);

const useTooltipContext = () => {
  const context = useContext(TooltipContext);

  if (context == null) {
    throw new Error('Tooltip components must be wrapped in <Tooltip />');
  }

  return context;
};

const Root = ({ children, ...options }: { children: React.ReactNode } & TooltipOptions) => {
  const tooltip = useTooltip(options);
  return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
};

const Trigger = (
  { children, asChild = false, ...props }: HTMLProps<HTMLElement> & { asChild?: boolean },
  propRef: ForwardedRef<HTMLElement>,
) => {
  const context = useTooltipContext();
  const childrenRef = (children as any).props.ref;
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...props,
        ...(children as any).props,
        'data-state': context.open ? 'open' : 'closed',
      }),
    );
  }

  return (
    <div ref={ref} data-state={context.open ? 'open' : 'closed'} {...context.getReferenceProps(props)}>
      {children}
    </div>
  );
};

const Content = (
  { style, children, ...props }: React.HTMLProps<HTMLDivElement>,
  propRef: React.Ref<HTMLDivElement>,
) => {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context.context, {
    initial: { opacity: 0 },
    duration: 200,
  });

  if (!isMounted) return null;

  return (
    <FloatingPortal>
      <div
        ref={ref}
        style={{
          ...context.floatingStyles,
          ...style,
          ...transitionStyles,
        }}
        data-state={context.open ? 'open' : 'closed'}
        {...context.getFloatingProps(props)}
      >
        {children}
      </div>
    </FloatingPortal>
  );
};

const Arrow = (props: Partial<ComponentProps<typeof FloatingArrow>>) => {
  const context = useTooltipContext();

  return (
    <FloatingArrow
      ref={context.arrowRef}
      context={context.context}
      height={8}
      width={16}
      strokeWidth={0.5}
      fill="none"
      {...props}
    />
  );
};

export default {
  Root,
  Trigger: forwardRef(Trigger),
  Content: forwardRef(Content),
  Arrow,
};

// const CustomArrow = React.forwardRef((props: React.SVGProps<SVGSVGElement>, ref: React.Ref<SVGSVGElement>) => (
//   <svg viewBox="0 0 24 12" xmlns="http://www.w3.org/2000/svg" {...props} ref={ref}>
//     <title>Arrow</title>
//     <path d="M0 0L12 8L24 0" vectorEffect="non-scaling-stroke" />
//   </svg>
// ));
