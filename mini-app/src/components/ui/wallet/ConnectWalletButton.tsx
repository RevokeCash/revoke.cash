import { useState } from "react";
import { useRevokeWallet, getConnectorName, getWalletIcon } from "../../../hooks/useRevokeWallet";
import { useDisconnect } from "wagmi";

/**
 * ConnectWalletButton with modal-style overlay similar to main Revoke.cash app
 */
export const ConnectWalletButton = () => {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { isConnected, address, connectors, connect } = useRevokeWallet();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#fff',
            color: '#18181b',
            border: '1px solid #e4e4e7',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {address?.slice(0, 6)}…{address?.slice(-4)}
          <span style={{ fontSize: '12px' }}>▼</span>
        </button>
        
        {dropdownOpen && (
          <>
            <div 
              onClick={() => setDropdownOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10
              }}
            />
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              backgroundColor: '#fff',
              border: '1px solid #e4e4e7',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              minWidth: '200px',
              zIndex: 20
            }}>
              <a
                href={`https://revoke.cash/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  color: '#18181b',
                  textDecoration: 'none',
                  fontSize: '14px',
                  borderBottom: '1px solid #e4e4e7'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f4f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                My Allowances
              </a>
              <button
                onClick={() => {
                  disconnect();
                  setDropdownOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#fff',
                  color: '#18181b',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f4f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#FDB952',
          color: '#000',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Connect Wallet
      </button>
      
      {open && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 40
            }}
          />
          
          {/* Modal */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            zIndex: 50,
            minWidth: '320px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h2 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '24px', 
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#18181b'
            }}>
              Connect Wallet
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => {
                    connect({ connector: connector as any });
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#fff',
                    border: '1px solid #e4e4e7',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f4f4f5';
                    e.currentTarget.style.borderColor = '#a1a1aa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.borderColor = '#e4e4e7';
                  }}
                >
                  <img 
                    src={getWalletIcon(connector)} 
                    alt={getConnectorName(connector)} 
                    style={{ 
                      width: '40px', 
                      height: '40px',
                      borderRadius: '8px'
                    }} 
                  />
                  <span style={{ color: '#18181b' }}>{getConnectorName(connector)}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ConnectWalletButton;