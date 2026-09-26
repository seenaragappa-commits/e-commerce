/** A shipping address, one part per line. The phone number and email are optional lines. */
export default function AddressBlock({ address, showPhone = false, showEmail = false }) {
  return (
    <address className="text-sm leading-6 text-slate-600 not-italic">
      <span className="font-semibold text-slate-900">{address.fullName}</span>
      <br />
      {address.address}
      <br />
      {address.city}, {address.state} {address.postalCode}
      <br />
      {address.country}
      {showPhone && (
        <>
          <br />
          {address.phone}
        </>
      )}
      {showEmail && (
        <>
          <br />
          {address.email}
        </>
      )}
    </address>
  );
}
