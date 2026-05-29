import { CodeBlock as UiCodeBlock, type CodeBlockProps as UiCodeBlockProps } from '@tutorials/ui';

type CodeBlockProps =
  | UiCodeBlockProps
  | (Omit<UiCodeBlockProps, 'children'> & { code: string; children?: never });

export default function CodeBlock(props: CodeBlockProps) {
  if ('code' in props && typeof props.code === 'string') {
    const { code, ...rest } = props;
    return <UiCodeBlock {...rest}>{code}</UiCodeBlock>;
  }
  return <UiCodeBlock {...(props as UiCodeBlockProps)} />;
}
