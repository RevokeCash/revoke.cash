import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkDirective from 'remark-directive';
import remarkDirectiveRehype from 'remark-directive-rehype';
import Href from './Href';
import Prose from './Prose';

interface Props {
  content: string;
  className?: string;
}

const MarkdownProse = ({ content, className }: Props) => {
  const components: Components & Record<string, any> = {
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
        <div className="my-5">
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
        remarkPlugins={[remarkDirective, remarkDirectiveRehype]}
        skipHtml
      />
    </Prose>
  );
};

export default MarkdownProse;
