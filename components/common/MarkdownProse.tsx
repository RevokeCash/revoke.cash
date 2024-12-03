import Image from 'next/image';
import ReactMarkdown, { Components } from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkDirective from 'remark-directive';
import remarkDirectiveRehype from 'remark-directive-rehype';
import remarkGfm from 'remark-gfm';
import Divider from './Divider';
import Href from './Href';
import Prose from './Prose';
import YouTubeEmbed from './YouTubeEmbed';

SyntaxHighlighter.registerLanguage('javascript', javascript);

interface Props {
  content: string;
  className?: string;
}

const MarkdownProse = ({ content, className }: Props) => {
  const components: Components & Record<string, any> = {
    h1: ({ children }) => {
      return (
        <>
          <h1>{children}</h1>
          <Divider className="my-4" />
        </>
      );
    },
    a: ({ href, children, rel }) => {
      return (
        <Href
          href={href!}
          rel={rel}
          underline="hover"
          external={!href!.startsWith('/')}
          router={href!.startsWith('/')}
          html
        >
          {children}
        </Href>
      );
    },
    // Add a nofollow attribute to these links (can only take a link as child)
    nofollow: (props: any) => {
      return { ...props.children, props: { ...props.children.props, rel: 'nofollow' } };
    },
    p: ({ children }) => {
      return <p>{children}</p>;
    },
    // We create a custom component for YouTube videos because we want to use the lite-youtube-embed package
    'youtube-video': (props: any) => {
      return <YouTubeEmbed {...props} />;
    },
    img: ({ src, alt, width, height }) => {
      if (!width || !height) {
        return (
          <p>
            <img src={src!} alt={alt ?? src!} />
          </p>
        );
      }

      return (
        <p>
          <Image src={src!} alt={alt ?? src!} width={width as any} height={height as any} />
        </p>
      );
    },
    // <pre> is handled by the code component (SyntaxHighlighter)
    pre: ({ children }) => <>{children}</>,
    code({ node, inline, className, children, ...props }: any) {
      const language = /language-(\w+)/.exec(className || '')?.[1];

      if (!language) {
        return <code {...props}>{children}</code>;
      }

      return (
        // @ts-ignore (Not sure why this is throwing an error)
        <SyntaxHighlighter
          customStyle={{ marginTop: '1.25em', marginBottom: '1.25em' }}
          style={dracula}
          language={language}
          children={String(children).replace(/\n$/, '')}
          {...props}
        />
      );
    },
  };

  return (
    <Prose className={className}>
      <ReactMarkdown
        children={content}
        components={components}
        remarkPlugins={[remarkGfm, remarkDirective, remarkDirectiveRehype]}
        skipHtml
      />
    </Prose>
  );
};

export default MarkdownProse;
