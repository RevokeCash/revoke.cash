export default function NotCommonBadge() {
  const src =
    'https://dnskzpklqkqxj.cloudfront.net/assets/new_images/verified_badges/notcommon-badge-white-on-black-739ac63e120267f1af9ba769832d728fa8a648de1fcad3820e4b655b43afb6d7.svg';
  return (
    <a href="https://not.co/collections/revoke-cash?verify=true" target="_blank">
      <img src={src} alt="NotCommon Verified" className="h-9 rounded-lg border border-white" />
    </a>
  );
}
