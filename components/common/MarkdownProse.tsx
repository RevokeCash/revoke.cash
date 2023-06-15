import ReactMarkdown, { Components } from 'react-markdown';
import Href from './Href';
import Prose from './Prose';

interface Props {
  content: string;
  className?: string;
}

const MarkdownProse = ({ content, className }: Props) => {
  const components: Components = {
    a: ({ href, children }) => {
      return (
        <Href href={href} underline="hover" external={!href.startsWith('/')} router={href.startsWith('/')} html>
          {children}
        </Href>
      );
    },
  };

  return (
    <Prose className={className}>
      <ReactMarkdown children={content} components={components} />
    </Prose>
  );
};

export default MarkdownProse;
