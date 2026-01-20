import { useState, useEffect, useCallback } from 'react';
import { gearAPI } from '../services/api';

function GearCollection() {
    const [gearData, setGearData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [opening, setOpening] = useState(false);
    const [reward, setReward] = useState(null);
    const [showReward, setShowReward] = useState(false);

    // Rarity configuration
    const RARITY_CONFIG = {
        common: { color: '#8B8B8B', name: 'Common', glow: 'none', order: 0, bonus: 3 },
        uncommon: { color: '#2ECC71', name: 'Uncommon', glow: '0 0 10px #2ECC71', order: 1, bonus: 5 },
        rare: { color: '#3498DB', name: 'Rare', glow: '0 0 15px #3498DB', order: 2, bonus: 8 },
        epic: { color: '#9B59B6', name: 'Epic', glow: '0 0 20px #9B59B6', order: 3, bonus: 12 },
        legendary: { color: '#F39C12', name: 'Legendary', glow: '0 0 25px #F39C12, 0 0 35px #F39C12', order: 4, bonus: 18 },
        mythic: { color: '#E74C3C', name: 'MYTHIC', glow: '0 0 30px #E74C3C, 0 0 50px #FFD700', order: 5, bonus: 25 }
    };

    // Slot display configuration
    const SLOT_CONFIG = {
        helmet: { label: 'Helmet', emoji: '👑' },
        shoulder: { label: 'Shoulders', emoji: '🛡️' },
        amulet: { label: 'Amulet', emoji: '📿' },
        cape: { label: 'Cape', emoji: '🧥' },
        chestplate: { label: 'Chestplate', emoji: '🛡️' },
        gauntlet: { label: 'Gauntlets', emoji: '🥊' },
        belt: { label: 'Belt', emoji: '🎗️' },
        boots: { label: 'Boots', emoji: '👢' }
    };

    const fetchGearData = useCallback(async () => {
        try {
            const data = await gearAPI.get();
            setGearData(data);
        } catch (error) {
            console.error('Failed to fetch gear data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGearData();
        // Check milestones on load
        gearAPI.checkMilestones().catch(console.error);
    }, [fetchGearData]);

    const handleOpenChest = async () => {
        if (!gearData || gearData.keys < 1 || opening) return;

        setOpening(true);
        setShowReward(false);

        try {
            // Simulate chest animation
            await new Promise(resolve => setTimeout(resolve, 1500));

            const result = await gearAPI.openChest();
            setReward(result.reward);
            setShowReward(true);

            // Refresh data
            await fetchGearData();
        } catch (error) {
            console.error('Failed to open chest:', error);
            alert(error.message || 'Failed to open chest');
        } finally {
            setOpening(false);
        }
    };

    const handleEquip = async (rarity) => {
        try {
            // If clicking the already equipped set, unequip it
            const targetRarity = gearData?.equippedSet === rarity ? null : rarity;
            await gearAPI.equip(targetRarity);
            await fetchGearData();
        } catch (error) {
            console.error('Failed to equip set:', error);
            alert(error.message || 'Failed to equip set');
        }
    };

    // Get sprite position for gear icon from 2x3 grid
    // Grid layout: Row 1: common, uncommon, rare | Row 2: epic, legendary, mythic
    const getGearIconStyle = (slot, rarity) => {
        const positions = {
            common: { x: 0, y: 0 },
            uncommon: { x: 1, y: 0 },
            rare: { x: 2, y: 0 },
            epic: { x: 0, y: 1 },
            legendary: { x: 1, y: 1 },
            mythic: { x: 2, y: 1 }
        };
        const pos = positions[rarity] || positions.common;
        return {
            backgroundImage: `url(/gear/${slot}.png)`,
            backgroundPosition: `${pos.x * 50}% ${pos.y * 100}%`,
            backgroundSize: '300% 200%',
            backgroundRepeat: 'no-repeat'
        };
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                color: 'var(--text-secondary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⚔️</div>
                    <p>Loading Armory...</p>
                </div>
            </div>
        );
    }

    const collectionProgress = Math.round((gearData?.collectedCount || 0) / 48 * 100);

    return (
        <div style={{ padding: 'var(--space-lg)', maxWidth: '1100px', margin: '0 auto' }}>
            {/* Compact Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-xl)',
                padding: 'var(--space-lg) var(--space-xl)',
                background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.2), rgba(255, 215, 0, 0.08))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255, 215, 0, 0.2)'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.8rem',
                        background: 'linear-gradient(135deg, #FFD700, #CD7F32)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '4px'
                    }}>
                        🏰 The Armory
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Complete rarity sets for XP boosts
                    </p>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-sm) var(--space-lg)',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: 'var(--radius-full)',
                    border: '2px solid rgba(255, 215, 0, 0.4)'
                }}>
                    <span style={{ fontSize: '1.3rem' }}>🔑</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFD700' }}>
                        {gearData?.keys || 0}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Keys</span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 340px',
                gap: 'var(--space-xl)'
            }}>
                {/* Left Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {/* Equipment Grid */}
                    <div style={{
                        background: 'var(--glass-bg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--glass-border)',
                        padding: 'var(--space-lg)'
                    }}>
                        <h2 style={{
                            fontSize: '1.1rem',
                            marginBottom: 'var(--space-md)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)'
                        }}>
                            ⚔️ Equipment Set
                        </h2>

                        {/* 2x4 Grid for Gear Slots */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 'var(--space-md)'
                        }}>
                            {Object.entries(SLOT_CONFIG).map(([slot, config]) => {
                                const gear = gearData?.gearBySlot?.[slot];
                                const isEmpty = !gear;
                                const rarity = gear?.rarity;
                                const rarityInfo = rarity ? RARITY_CONFIG[rarity] : null;

                                return (
                                    <div
                                        key={slot}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                        title={gear ? `${gear.name}\n${gear.lore}` : `${config.label} - Empty`}
                                    >
                                        <div style={{
                                            width: '70px',
                                            height: '70px',
                                            borderRadius: 'var(--radius-md)',
                                            border: isEmpty
                                                ? '2px dashed rgba(255,255,255,0.15)'
                                                : `2px solid ${rarityInfo?.color}`,
                                            background: isEmpty
                                                ? 'rgba(0,0,0,0.2)'
                                                : `linear-gradient(135deg, ${rarityInfo?.color}20, rgba(0,0,0,0.4))`,
                                            boxShadow: isEmpty ? 'none' : rarityInfo?.glow,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.3s ease',
                                            cursor: gear ? 'pointer' : 'default',
                                            overflow: 'hidden'
                                        }}>
                                            {isEmpty ? (
                                                <span style={{
                                                    fontSize: '1.8rem',
                                                    opacity: 0.25,
                                                    filter: 'grayscale(100%)'
                                                }}>
                                                    {config.emoji}
                                                </span>
                                            ) : (
                                                <div
                                                    style={{
                                                        width: '56px',
                                                        height: '56px',
                                                        ...getGearIconStyle(slot, rarity)
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            color: isEmpty ? 'var(--text-muted)' : rarityInfo?.color,
                                            fontWeight: isEmpty ? 400 : 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.3px',
                                            textAlign: 'center'
                                        }}>
                                            {config.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Set Bonuses Section */}
                    <div style={{
                        background: 'var(--glass-bg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--glass-border)',
                        padding: 'var(--space-lg)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 'var(--space-md)'
                        }}>
                            <h2 style={{
                                fontSize: '1.1rem',
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-sm)'
                            }}>
                                ✨ Set Bonuses
                            </h2>
                            <div style={{
                                padding: '4px 12px',
                                background: gearData?.xpBonusPercent > 0
                                    ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.3), rgba(39, 174, 96, 0.2))'
                                    : 'rgba(0,0,0,0.2)',
                                borderRadius: 'var(--radius-full)',
                                border: gearData?.xpBonusPercent > 0
                                    ? '1px solid rgba(46, 204, 113, 0.5)'
                                    : '1px solid var(--glass-border)',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: gearData?.xpBonusPercent > 0 ? '#2ECC71' : 'var(--text-muted)'
                            }}>
                                {gearData?.xpBonusPercent > 0 ? `+${gearData.xpBonusPercent}% XP` : 'No bonus yet'}
                            </div>
                        </div>

                        {gearData?.levelMultiplier > 1 && (
                            <div style={{
                                marginBottom: 'var(--space-md)',
                                padding: '8px 12px',
                                background: 'rgba(52, 152, 219, 0.1)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(52, 152, 219, 0.3)',
                                fontSize: '0.8rem',
                                color: '#3498DB'
                            }}>
                                🎮 Level {gearData.userLevel} bonus: {gearData.levelMultiplier}× multiplier
                            </div>
                        )}

                        {/* Set Progress Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 'var(--space-sm)'
                        }}>
                            {Object.entries(RARITY_CONFIG).map(([rarity, config]) => {
                                const progress = gearData?.setProgress?.[rarity] || 0;
                                const isComplete = progress === 8;
                                const isEquipped = gearData?.equippedSet === rarity;

                                return (
                                    <div
                                        key={rarity}
                                        style={{
                                            padding: 'var(--space-sm)',
                                            background: isEquipped
                                                ? `linear-gradient(135deg, ${config.color}40, ${config.color}20)`
                                                : isComplete
                                                    ? `linear-gradient(135deg, ${config.color}25, ${config.color}10)`
                                                    : 'rgba(0,0,0,0.2)',
                                            border: isEquipped
                                                ? `2px solid ${config.color}`
                                                : `1px solid ${isComplete ? config.color : 'rgba(255,255,255,0.1)'}`,
                                            borderRadius: 'var(--radius-sm)',
                                            textAlign: 'center',
                                            boxShadow: isEquipped ? `0 0 15px ${config.color}50` : 'none'
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: isEquipped ? config.color : isComplete ? config.color : 'var(--text-muted)',
                                            fontWeight: 600,
                                            marginBottom: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px'
                                        }}>
                                            {isEquipped && <span>⚔️</span>}
                                            {config.name}
                                        </div>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: isEquipped ? config.color : isComplete ? config.color : 'var(--text-secondary)'
                                        }}>
                                            {progress}/8
                                        </div>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            color: isEquipped ? '#2ECC71' : 'var(--text-muted)',
                                            marginTop: '2px'
                                        }}>
                                            {isEquipped ? `+${config.bonus}% active` : `+${config.bonus}%`}
                                        </div>
                                        {/* Mini progress bar */}
                                        <div style={{
                                            marginTop: '6px',
                                            height: '3px',
                                            background: 'rgba(0,0,0,0.3)',
                                            borderRadius: '2px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${(progress / 8) * 100}%`,
                                                height: '100%',
                                                background: config.color,
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        {/* Equip/Unequip button for completed sets */}
                                        {isComplete && (
                                            <button
                                                onClick={() => handleEquip(rarity)}
                                                style={{
                                                    marginTop: '8px',
                                                    padding: '4px 12px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    background: isEquipped
                                                        ? 'transparent'
                                                        : `linear-gradient(135deg, ${config.color}, ${config.color}CC)`,
                                                    border: isEquipped
                                                        ? `1px solid ${config.color}`
                                                        : 'none',
                                                    borderRadius: 'var(--radius-sm)',
                                                    color: isEquipped ? config.color : '#000',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {isEquipped ? 'Unequip' : 'Equip'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {/* Ancient Chest */}
                    <div style={{
                        background: 'var(--glass-bg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--glass-border)',
                        padding: 'var(--space-lg)',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
                            🎁 Ancient Chest
                        </h2>

                        {/* Chest Image */}
                        <div
                            onClick={handleOpenChest}
                            style={{
                                width: '160px',
                                height: '130px',
                                margin: '0 auto var(--space-md)',
                                backgroundImage: 'url(/gear/chest.png)',
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                cursor: gearData?.keys >= 1 && !opening ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s ease',
                                transform: opening ? 'scale(1.1)' : 'scale(1)',
                                filter: gearData?.keys < 1 ? 'grayscale(50%) brightness(0.7)' : 'none',
                                animation: opening ? 'shake 0.15s infinite' : 'none'
                            }}
                        />

                        <style>{`
                            @keyframes shake {
                                0%, 100% { transform: rotate(-2deg) scale(1.1); }
                                50% { transform: rotate(2deg) scale(1.1); }
                            }
                            @keyframes glow {
                                0%, 100% { box-shadow: 0 0 20px currentColor; }
                                50% { box-shadow: 0 0 40px currentColor, 0 0 60px currentColor; }
                            }
                        `}</style>

                        <button
                            onClick={handleOpenChest}
                            disabled={gearData?.keys < 1 || opening || gearData?.collectedCount >= 48}
                            style={{
                                padding: 'var(--space-sm) var(--space-lg)',
                                fontSize: '1rem',
                                fontWeight: 700,
                                background: gearData?.keys >= 1 && !opening
                                    ? 'linear-gradient(135deg, #FFD700, #CD7F32)'
                                    : 'rgba(100,100,100,0.3)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                color: gearData?.keys >= 1 ? '#000' : 'var(--text-muted)',
                                cursor: gearData?.keys >= 1 && !opening ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-sm)',
                                margin: '0 auto'
                            }}
                        >
                            {opening ? (
                                <>⏳ Opening...</>
                            ) : gearData?.collectedCount >= 48 ? (
                                <>✨ Complete!</>
                            ) : (
                                <>🔑 Open (1 Key)</>
                            )}
                        </button>

                        {gearData?.keys < 1 && gearData?.collectedCount < 48 && (
                            <p style={{
                                marginTop: 'var(--space-sm)',
                                color: 'var(--text-muted)',
                                fontSize: '0.75rem'
                            }}>
                                Earn keys by gaining XP!
                            </p>
                        )}
                    </div>

                    {/* Collection Progress */}
                    <div style={{
                        background: 'var(--glass-bg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--glass-border)',
                        padding: 'var(--space-lg)'
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
                            📊 Collection
                        </h3>

                        {/* Progress Bar */}
                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 'var(--radius-full)',
                            height: '20px',
                            overflow: 'hidden',
                            marginBottom: 'var(--space-md)'
                        }}>
                            <div style={{
                                width: `${collectionProgress}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #CD7F32, #FFD700, #E74C3C)',
                                borderRadius: 'var(--radius-full)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: '#000',
                                transition: 'width 0.5s ease'
                            }}>
                                {collectionProgress > 15 && `${gearData?.collectedCount || 0}/48`}
                            </div>
                        </div>

                        {/* Stats */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 'var(--space-sm)'
                        }}>
                            <div style={{
                                padding: 'var(--space-sm)',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: 'var(--radius-sm)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFD700' }}>
                                    {gearData?.chestsOpened || 0}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Chests Opened
                                </div>
                            </div>
                            <div style={{
                                padding: 'var(--space-sm)',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: 'var(--radius-sm)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2ECC71' }}>
                                    {gearData?.totalKeysEarned || 0}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Keys Earned
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collection List */}
            {gearData?.collectedGear?.length > 0 && (
                <div style={{
                    marginTop: 'var(--space-xl)',
                    background: 'var(--glass-bg)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--glass-border)',
                    padding: 'var(--space-lg)'
                }}>
                    <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
                        🏆 Your Collection ({gearData.collectedGear.length} items)
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: 'var(--space-sm)'
                    }}>
                        {gearData.collectedGear
                            .sort((a, b) => RARITY_CONFIG[b.rarity].order - RARITY_CONFIG[a.rarity].order)
                            .map((item, idx) => {
                                const config = RARITY_CONFIG[item.rarity];
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: 'var(--space-sm)',
                                            background: `linear-gradient(135deg, ${config.color}15, transparent)`,
                                            border: `1px solid ${config.color}40`,
                                            borderRadius: 'var(--radius-sm)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-sm)'
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '4px',
                                                border: `1px solid ${config.color}`,
                                                background: 'rgba(0,0,0,0.3)',
                                                flexShrink: 0,
                                                ...getGearIconStyle(item.slot, item.rarity)
                                            }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                color: config.color,
                                                fontSize: '0.8rem',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {item.name}
                                            </div>
                                            <div style={{
                                                fontSize: '0.65rem',
                                                color: 'var(--text-muted)',
                                                textTransform: 'capitalize'
                                            }}>
                                                {item.slot}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Reward Modal */}
            {showReward && reward && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        animation: 'fadeIn 0.3s ease'
                    }}
                    onClick={() => setShowReward(false)}
                >
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes scaleIn {
                            from { transform: scale(0.5); opacity: 0; }
                            to { transform: scale(1); opacity: 1; }
                        }
                        @keyframes pulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.05); }
                        }
                    `}</style>
                    <div
                        style={{
                            background: `linear-gradient(135deg, ${RARITY_CONFIG[reward.rarity].color}30, rgba(0,0,0,0.9))`,
                            border: `3px solid ${RARITY_CONFIG[reward.rarity].color}`,
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-xl)',
                            textAlign: 'center',
                            maxWidth: '350px',
                            animation: 'scaleIn 0.5s ease',
                            boxShadow: RARITY_CONFIG[reward.rarity].glow
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{
                            fontSize: '0.85rem',
                            color: RARITY_CONFIG[reward.rarity].color,
                            textTransform: 'uppercase',
                            letterSpacing: '3px',
                            marginBottom: 'var(--space-md)',
                            fontWeight: 700
                        }}>
                            {RARITY_CONFIG[reward.rarity].name}
                        </div>

                        <div
                            style={{
                                width: '100px',
                                height: '100px',
                                margin: '0 auto var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                border: `3px solid ${RARITY_CONFIG[reward.rarity].color}`,
                                boxShadow: RARITY_CONFIG[reward.rarity].glow,
                                animation: 'pulse 2s infinite',
                                background: 'rgba(0,0,0,0.4)',
                                ...getGearIconStyle(reward.slot, reward.rarity)
                            }}
                        />

                        <h2 style={{
                            color: RARITY_CONFIG[reward.rarity].color,
                            marginBottom: 'var(--space-sm)',
                            fontSize: '1.3rem'
                        }}>
                            {reward.name}
                        </h2>

                        <p style={{
                            color: 'var(--text-secondary)',
                            fontStyle: 'italic',
                            marginBottom: 'var(--space-md)',
                            fontSize: '0.9rem'
                        }}>
                            "{reward.lore}"
                        </p>

                        <div style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            textTransform: 'capitalize'
                        }}>
                            {reward.slot} Slot
                        </div>

                        <button
                            onClick={() => setShowReward(false)}
                            style={{
                                marginTop: 'var(--space-md)',
                                padding: 'var(--space-sm) var(--space-lg)',
                                background: RARITY_CONFIG[reward.rarity].color,
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                color: '#000',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            Awesome! ✨
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GearCollection;
