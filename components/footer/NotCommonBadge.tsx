import Image from 'next/image';

export default function NotCommonBadge() {
  return (
    <a href="https://notcommon.com/revokecash?verify=true" target="_blank" referrerPolicy="origin">
      <Image
        src="/assets/images/vendor/notcommon.svg"
        alt="NotCommon Verified"
        className="h-9 bg-black rounded-lg border border-white"
        height="36"
        width="83"
      />
    </a>
  );
}
