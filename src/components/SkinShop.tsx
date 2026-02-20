import { type CSSProperties } from 'react';
import { getAvailableSkins, canAffordSkin } from '../game/creditLogic';
import type { PlayerData, Mark, SkinId } from '../game/types';

interface SkinShopProps {
  players: readonly [PlayerData, PlayerData];
  onPurchase: (playerMark: Mark, skinId: SkinId) => void;
  onEquip: (playerMark: Mark, skinId: SkinId) => void;
  onClose: () => void;
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    fontFamily: 'monospace',
  } satisfies CSSProperties,

  modal: {
    background: 'rgba(10, 10, 20, 0.95)',
    border: '2px solid #00ffff',
    borderRadius: '8px',
    padding: '28px 32px',
    maxWidth: '680px',
    width: '90vw',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 0 40px #00ffff33, 0 0 80px #ff00ff22',
  } satisfies CSSProperties,

  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#ff00ff',
    textAlign: 'center',
    marginBottom: '20px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
  } satisfies CSSProperties,

  columnsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '20px',
  } satisfies CSSProperties,

  playerColumn: (color: string): CSSProperties => ({
    background: 'rgba(0, 0, 0, 0.4)',
    border: `1px solid ${color}44`,
    borderRadius: '6px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }),

  playerHeader: {
    textAlign: 'center',
    marginBottom: '4px',
  } satisfies CSSProperties,

  playerName: (color: string): CSSProperties => ({
    fontSize: '14px',
    fontWeight: 'bold',
    color,
  }),

  playerCredits: {
    fontSize: '13px',
    color: '#ff00ff',
    fontWeight: 'bold',
  } satisfies CSSProperties,

  skinItem: (isActive: boolean, color: string): CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: '20px 1fr auto',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    background: isActive ? `${color}15` : 'rgba(0, 0, 0, 0.3)',
    border: `1px solid ${isActive ? color : '#00ffff22'}`,
    borderRadius: '4px',
  }),

  colorDot: (color: string): CSSProperties => ({
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: color,
    border: '2px solid #00ffff44',
    boxShadow: `0 0 6px ${color}66`,
  }),

  skinInfo: {
    minWidth: 0,
  } satisfies CSSProperties,

  skinName: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#00ffff',
  } satisfies CSSProperties,

  skinPrice: {
    fontSize: '10px',
    color: '#ff00ff',
  } satisfies CSSProperties,

  actionBtn: (disabled: boolean, isActive: boolean): CSSProperties => ({
    padding: '4px 10px',
    minWidth: '58px',
    background: isActive ? '#00ffff22' : disabled ? 'rgba(0, 0, 0, 0.4)' : '#ff00ff22',
    border: `1px solid ${isActive ? '#00ffff' : disabled ? '#555' : '#ff00ff'}`,
    borderRadius: '3px',
    color: isActive ? '#00ffff' : disabled ? '#555' : '#ff00ff',
    fontFamily: 'monospace',
    fontSize: '10px',
    fontWeight: 'bold',
    cursor: disabled || isActive ? 'default' : 'pointer',
    textTransform: 'uppercase',
    textAlign: 'center',
    transition: 'background 0.2s',
  }),

  closeButton: {
    width: '100%',
    padding: '10px',
    background: 'rgba(0, 0, 0, 0.6)',
    border: '1px solid #00ffff',
    borderRadius: '4px',
    color: '#00ffff',
    fontFamily: 'monospace',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'background 0.2s',
  } satisfies CSSProperties,
};

const PlayerSkinColumn = ({
  player,
  otherPlayer,
  skins,
  onPurchase,
  onEquip,
  color,
  index,
}: {
  player: PlayerData;
  otherPlayer: PlayerData;
  skins: ReturnType<typeof getAvailableSkins>;
  onPurchase: (playerMark: Mark, skinId: SkinId) => void;
  onEquip: (playerMark: Mark, skinId: SkinId) => void;
  color: string;
  index: number;
}) => {
  const isOwned = (skinId: SkinId) => player.unlockedSkins.includes(skinId);
  const isActive = (skinId: SkinId) => player.activeSkin === skinId;
  const isLockedByOther = (skinId: SkinId) =>
    skinId !== 'default' && otherPlayer.activeSkin === skinId;

  const isDisabled = (skinId: SkinId) => {
    if (isLockedByOther(skinId)) return true;
    if (isOwned(skinId)) return false;
    const skin = skins.find(s => s.id === skinId);
    return !skin || !canAffordSkin(player, skin);
  };

  const getLabel = (skinId: SkinId) => {
    if (isActive(skinId)) return 'Active';
    if (isLockedByOther(skinId)) return 'In Use';
    if (isOwned(skinId)) return 'Equip';
    return 'Buy';
  };

  const handleClick = (skinId: SkinId) => {
    if (isActive(skinId) || isLockedByOther(skinId)) return;
    if (isOwned(skinId)) {
      onEquip(player.mark, skinId);
    } else {
      onPurchase(player.mark, skinId);
    }
  };

  return (
    <div style={styles.playerColumn(color)} data-testid={`shop-player-${index}`}>
      <div style={styles.playerHeader}>
        <div style={styles.playerName(color)}>
          {player.mark} — {player.name}
        </div>
        <div style={styles.playerCredits}>¢ {player.credits}</div>
      </div>

      {skins.map(skin => (
        <div
          key={skin.id}
          style={styles.skinItem(isActive(skin.id), color)}
          data-testid={`skin-row-${skin.id}-${player.mark}`}
        >
          <div style={styles.colorDot(skin.color)} />
          <div style={styles.skinInfo}>
            <div style={styles.skinName}>{skin.name}</div>
            <div style={styles.skinPrice}>
              {skin.price === 0 ? 'Free' : `¢ ${skin.price}`}
            </div>
          </div>
          <button
            style={styles.actionBtn(isDisabled(skin.id), isActive(skin.id))}
            disabled={isActive(skin.id) || isDisabled(skin.id)}
            onClick={() => handleClick(skin.id)}
            data-testid={`buy-${skin.id}-${player.mark}`}
          >
            {getLabel(skin.id)}
          </button>
        </div>
      ))}
    </div>
  );
};

export const SkinShop = ({ players, onPurchase, onEquip, onClose }: SkinShopProps) => {
  const skins = getAvailableSkins();

  return (
    <div style={styles.overlay} data-testid="skin-shop">
      <div style={styles.modal}>
        <div style={styles.title}>Skin Shop</div>

        <div style={styles.columnsRow}>
          <PlayerSkinColumn
            player={players[0]}
            otherPlayer={players[1]}
            skins={skins}
            onPurchase={onPurchase}
            onEquip={onEquip}
            color="#00ffff"
            index={0}
          />
          <PlayerSkinColumn
            player={players[1]}
            otherPlayer={players[0]}
            skins={skins}
            onPurchase={onPurchase}
            onEquip={onEquip}
            color="#ff00ff"
            index={1}
          />
        </div>

        <button
          style={styles.closeButton}
          onClick={onClose}
          data-testid="shop-close-btn"
        >
          Close
        </button>
      </div>
    </div>
  );
};
