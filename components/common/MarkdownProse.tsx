import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import ReactMarkdown, { Components } from 'react-markdown';
import { AllowElement } from 'react-markdown/lib/rehype-filter';
import rehypeRaw from 'rehype-raw';
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

  const allowElement: AllowElement = ({ tagName, children }) => {
    // Including YouTube videos in paragraphs causes hydration errors, so we "disallow" <p> tags that contain a
    // <youtube-video> tag. Combined with unwrapDisallowed, this will remove the <p> tag and only render the video.
    if (tagName === 'p' && children.some((child) => child.type === 'element' && child.tagName === 'youtube-video')) {
      return false;
    }

    return true;
  };

  return (
    <Prose className={className}>
      <ReactMarkdown
        children={content}
        components={components}
        rehypePlugins={[rehypeRaw]}
        allowElement={allowElement}
        unwrapDisallowed
      />
    </Prose>
  );
};

export default MarkdownProse;
