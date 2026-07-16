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
  size,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole,
  useTransitionStyles,
} from '@floating-ui/react';
import React, { type ComponentProps, type HTMLProps, useContext, useMemo, useRef, useState } from 'react';

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
      size({
        padding: 8,
        apply({ availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${availableHeight}px`,
          });
        },
      }),
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
  return <TooltipContext value={tooltip}>{children}</TooltipContext>;
};

const Trigger = ({
  children,
  asChild = false,
  ref: propRef,
  ...props
}: HTMLProps<HTMLElement> & { asChild?: boolean }) => {
  const context = useTooltipContext();
  // In React 19 the child's own `ref` is part of its props, so we separate it out and merge it,
  // rather than letting it override the merged ref when spreading the child's props below
  const { ref: childrenRef, ...childrenProps } = (children as any)?.props ?? {};
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...props,
        ...childrenProps,
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

const Content = ({ style, children, ref: propRef, ...props }: React.HTMLProps<HTMLDivElement>) => {
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
  Trigger,
  Content,
  Arrow,
};
