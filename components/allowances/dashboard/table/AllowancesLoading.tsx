import Spinner from 'components/common/Spinner';

interface Props {
  loadingMessage?: string;
}

const AllowancesLoading = ({ loadingMessage }: Props) => {
  return (
    <>
      {loadingMessage}
      <Spinner className="w-6 h-6 allowances-loader" />
    </>
  );
};

export default AllowancesLoading;
