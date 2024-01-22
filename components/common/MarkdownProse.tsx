import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkDirective from 'remark-directive';
import remarkDirectiveRehype from 'remark-directive-rehype';
import remarkGfm from 'remark-gfm';
import Divider from './Divider';
import Href from './Href';
import Prose from './Prose';

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
    a: ({ href, children }) => {
      return (
        <Href href={href} underline="hover" external={!href.startsWith('/')} router={href.startsWith('/')} html>
          {children}
        </Href>
      );
    },
    p: ({ children }) => {
      return <p>{children}</p>;
    },
    // We create a custom component for YouTube videos because we want to use the lite-youtube-embed package
    'youtube-video': (props: any) => {
      return (
        <div className="my-5 border border-black dark:border-white rounded-lg overflow-hidden">
          <LiteYouTubeEmbed poster="maxresdefault" noCookie={true} {...props} />
        </div>
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
