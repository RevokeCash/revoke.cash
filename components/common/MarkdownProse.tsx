import Faq from 'components/faq/Faq';
import FaqItem from 'components/faq/FaqItem';
import ArticleMeta from 'components/learn/ArticleMeta';
import type { ContentMeta } from 'lib/interfaces';
import { slugify } from 'lib/utils';
import Image from 'next/image';
import ReactMarkdown, { type Components } from 'react-markdown';
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
  meta?: ContentMeta;
  className?: string;
}

const MarkdownProse = ({ content, meta, className }: Props) => {
  const components: Components & Record<string, any> = {
    h1: ({ children }) => {
      return (
        <>
          <h1>{children}</h1>
          {meta ? <ArticleMeta meta={meta} /> : null}
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
            {/* biome-ignore lint/performance/noImgElement: we only use this img element when we specifically cannot use the Image component */}
            <img src={src as string} alt={alt ?? (src as string)} />
          </p>
        );
      }

      return (
        <p>
          <Image src={src as string} alt={alt ?? (src as string)} width={width as any} height={height as any} />
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
        <SyntaxHighlighter
          customStyle={{ marginTop: '1.25em', marginBottom: '1.25em' }}
          style={dracula}
          language={language}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    },
    faq: ({ children }: any) => {
      return <Faq>{children}</Faq>;
    },
    'faq-item': ({ children, question }: any) => {
      return (
        <FaqItem question={question} slug={slugify(question)} heading="h3" wrapper="div">
          {children}
        </FaqItem>
      );
    },
  };

  return (
    <Prose className={className}>
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm, remarkDirective, remarkDirectiveRehype]}
        skipHtml
      >
        {content}
      </ReactMarkdown>
    </Prose>
  );
};

export default MarkdownProse;
