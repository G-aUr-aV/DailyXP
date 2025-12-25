import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import MultiRangeDatePicker from './MultiRangeDatePicker';
import { formatDisplayDate, getDatePresets } from '../utils/dateUtils';
import {
    STATUS_FILTER_OPTIONS,
    TYPE_FILTER_OPTIONS,
    DATE_FIELD_OPTIONS,
    DEFAULT_FILTERS
} from '../utils/constants';

/**
 * Shared QuestFilter component for filtering quests across pages
 * 
 * @param {Object} props
 * @param {Function} props.onFilterChange - Callback with current filter state
 * @param {Object} props.config - Configuration options
 * @param {string} props.config.mode - 'client' for local state, 'url' for URL params
 * @param {string[]} props.config.hiddenFilters - Filter keys to hide (e.g., ['dateRanges'])
 * @param {Object} props.config.lockedFilters - Filters that are non-editable (e.g., { status: 'active' })
 * @param {boolean} props.config.defaultCollapsed - Whether filter panel starts collapsed
 * @param {number} props.resultCount - Number of results to display
 */
function QuestFilter({ onFilterChange, config = {}, resultCount = 0 }) {
    const {
        mode = 'client',
        hiddenFilters = [],
        lockedFilters = {},
        defaultCollapsed = false
    } = config;

    const [searchParams, setSearchParams] = useSearchParams();
    const [showFilters, setShowFilters] = useState(!defaultCollapsed);
    const prevFiltersRef = useRef(null);
    const isInitialMount = useRef(true);

    // Local state for client mode
    const [localFilters, setLocalFilters] = useState({
        status: 'active',
        type: 'all',
        spilled: false,
        dateField: 'deadline',
        dateRanges: []
    });

    // Get current filter values based on mode
    const getFilterValue = (key) => {
        // Locked filters take precedence
        if (lockedFilters[key] !== undefined) {
            return lockedFilters[key];
        }

        if (mode === 'url') {
            if (key === 'dateRanges') {
                const rangesParam = searchParams.get('dateRanges');
                if (rangesParam) {
                    try {
                        return JSON.parse(rangesParam);
                    } catch (e) {
                        return [];
                    }
                }
                return [];
            }
            if (key === 'spilled') {
                return searchParams.get('spilled') === 'true';
            }
            return searchParams.get(key) || (key === 'status' ? 'all' : key === 'type' ? 'all' : 'deadline');
        }

        return localFilters[key];
    };

    const statusFilter = getFilterValue('status');
    const typeFilter = getFilterValue('type');
    const spilledFilter = getFilterValue('spilled');
    const dateField = getFilterValue('dateField');
    const dateRanges = getFilterValue('dateRanges');

    // Set filter value based on mode
    const setFilter = (key, value) => {
        // Don't allow changing locked filters
        if (lockedFilters[key] !== undefined) return;

        if (mode === 'url') {
            const newParams = new URLSearchParams(searchParams);
            if (key === 'dateRanges') {
                if (value.length > 0) {
                    newParams.set('dateRanges', JSON.stringify(value));
                } else {
                    newParams.delete('dateRanges');
                }
            } else if (key === 'spilled') {
                if (value) {
                    newParams.set('spilled', 'true');
                } else {
                    newParams.delete('spilled');
                }
            } else if (value === 'all' || value === '') {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
            setSearchParams(newParams);
        } else {
            setLocalFilters(prev => ({ ...prev, [key]: value }));
        }
    };

    // Notify parent of filter changes - only when values actually change
    useEffect(() => {
        const currentFilters = {
            status: statusFilter,
            type: typeFilter,
            spilled: spilledFilter,
            dateField,
            dateRanges
        };

        const currentSerialized = JSON.stringify(currentFilters);

        // Skip if values haven't changed
        if (prevFiltersRef.current === currentSerialized) {
            return;
        }

        prevFiltersRef.current = currentSerialized;

        // Skip calling onFilterChange on initial mount in URL mode
        // because the parent already has the initial filter values
        if (isInitialMount.current && mode === 'url') {
            isInitialMount.current = false;
            return;
        }

        isInitialMount.current = false;
        onFilterChange?.(currentFilters);
    }, [statusFilter, typeFilter, spilledFilter, dateField, dateRanges, mode]);

    const clearAllFilters = () => {
        if (mode === 'url') {
            setSearchParams({});
        } else {
            setLocalFilters({
                status: lockedFilters.status || 'active',
                type: lockedFilters.type || 'all',
                spilled: false,
                dateField: 'deadline',
                dateRanges: []
            });
        }
    };

    const removeRange = (index) => {
        const newRanges = dateRanges.filter((_, i) => i !== index);
        setFilter('dateRanges', newRanges);
    };

    // formatDisplayDate is now imported from utils/dateUtils

    const isHidden = (filterKey) => hiddenFilters.includes(filterKey);
    const isLocked = (filterKey) => lockedFilters[filterKey] !== undefined;

    const hasActiveFilters =
        (statusFilter !== 'all' && statusFilter !== (lockedFilters.status || 'all')) ||
        typeFilter !== 'all' ||
        spilledFilter ||
        dateRanges.length > 0;

    const activeFilterCount =
        ((statusFilter !== 'all' && !isLocked('status')) ? 1 : 0) +
        (typeFilter !== 'all' ? 1 : 0) +
        (spilledFilter ? 1 : 0) +
        dateRanges.length;

    // Use imported constants for filter options
    const statusOptions = STATUS_FILTER_OPTIONS;
    const typeOptions = TYPE_FILTER_OPTIONS;
    const dateFieldOptions = DATE_FIELD_OPTIONS;
    const datePresets = getDatePresets();

    const renderFilterButton = (option, currentValue, filterKey, isActive) => {
        const active = isActive !== undefined ? isActive : currentValue === option.value;
        const locked = isLocked(filterKey);

        return (
            <button
                key={option.value}
                onClick={() => {
                    if (locked) return;
                    if (option.isSpilledToggle) {
                        setFilter('spilled', !spilledFilter);
                    } else {
                        setFilter(filterKey, option.value);
                        if (filterKey === 'status') {
                            setFilter('spilled', false);
                        }
                    }
                }}
                disabled={locked}
                style={{
                    padding: '8px 14px',
                    background: active
                        ? option.color
                            ? `linear-gradient(135deg, ${option.color}, ${option.color}cc)`
                            : 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-blue))'
                        : 'rgba(255, 255, 255, 0.03)',
                    border: active ? 'none' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-full)',
                    color: active ? 'white' : 'var(--text-secondary)',
                    cursor: locked ? 'not-allowed' : 'pointer',
                    fontWeight: active ? 600 : 400,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    opacity: locked ? 0.6 : 1,
                    boxShadow: active && option.color ? `0 2px 8px ${option.color}40` : 'none'
                }}
            >
                {option.icon} {option.label}
                {locked && <span style={{ fontSize: '0.7rem' }}>🔒</span>}
            </button>
        );
    };

    return (
        <>
            {/* Filter Panel */}
            {showFilters && (
                <div style={{
                    marginBottom: 'var(--space-xl)',
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--glass-border)',
                    overflow: 'hidden'
                }}>
                    {/* Filter Header */}
                    <div style={{
                        padding: '16px 20px',
                        background: 'linear-gradient(90deg, rgba(0, 255, 204, 0.05), transparent)',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '1.2rem' }}>⚙️</span>
                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Filter Quests</span>
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                style={{
                                    padding: '6px 12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: 'var(--error)',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                ✕ Clear All
                            </button>
                        )}
                    </div>

                    {/* Filter Content */}
                    <div style={{ padding: '20px' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '24px'
                        }}>
                            {/* Status Filter */}
                            {!isHidden('status') && (
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '10px',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        fontWeight: 600
                                    }}>
                                        Status
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {statusOptions.map(status =>
                                            renderFilterButton(
                                                status,
                                                statusFilter,
                                                'status',
                                                status.isSpilledToggle ? spilledFilter : statusFilter === status.value
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Type Filter */}
                            {!isHidden('type') && (
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '10px',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        fontWeight: 600
                                    }}>
                                        Quest Type
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {typeOptions.map(type =>
                                            renderFilterButton(type, typeFilter, 'type')
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Date Field */}
                            {!isHidden('dateField') && (
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '10px',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        fontWeight: 600
                                    }}>
                                        Date Field
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {dateFieldOptions.map(field => (
                                            <button
                                                key={field.value}
                                                onClick={() => setFilter('dateField', field.value)}
                                                style={{
                                                    padding: '8px 14px',
                                                    background: dateField === field.value
                                                        ? 'linear-gradient(135deg, var(--aurora-purple), var(--aurora-pink))'
                                                        : 'rgba(255, 255, 255, 0.03)',
                                                    border: dateField === field.value ? 'none' : '1px solid var(--glass-border)',
                                                    borderRadius: 'var(--radius-full)',
                                                    color: dateField === field.value ? 'white' : 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    fontWeight: dateField === field.value ? 600 : 400,
                                                    fontSize: '0.85rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {field.icon} {field.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Date Range Section */}
                        {!isHidden('dateRanges') && (
                            <div style={{
                                marginTop: '24px',
                                paddingTop: '20px',
                                borderTop: '1px solid var(--glass-border)'
                            }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '12px',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: 600
                                }}>
                                    Date Ranges
                                </label>

                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {/* Calendar Picker */}
                                    <MultiRangeDatePicker
                                        ranges={dateRanges}
                                        onChange={(newRanges) => setFilter('dateRanges', newRanges)}
                                        dateField={dateField}
                                    />

                                    {/* Quick Add Buttons */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        flexWrap: 'wrap',
                                        padding: '8px 12px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px dashed var(--glass-border)'
                                    }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Quick add:</span>
                                        {datePresets.map(preset => (
                                            <button
                                                key={preset.label}
                                                onClick={() => setFilter('dateRanges', [...dateRanges, preset])}
                                                style={{
                                                    padding: '4px 10px',
                                                    background: 'transparent',
                                                    border: '1px solid var(--aurora-teal)',
                                                    borderRadius: 'var(--radius-full)',
                                                    color: 'var(--aurora-teal)',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer',
                                                    fontWeight: 500
                                                }}
                                            >
                                                + {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Active Date Ranges */}
                                {dateRanges.length > 0 && (
                                    <div style={{
                                        marginTop: '16px',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active:</span>
                                        {dateRanges.map((range, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{
                                                    padding: '6px 12px',
                                                    background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.15), rgba(139, 92, 246, 0.1))',
                                                    border: '1px solid rgba(0, 255, 204, 0.25)',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '0.85rem',
                                                    color: 'var(--aurora-teal)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <span style={{ fontWeight: 600 }}>{formatDisplayDate(range.from)}</span>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                                                    <span style={{ fontWeight: 600 }}>{formatDisplayDate(range.to)}</span>
                                                    <button
                                                        onClick={() => removeRange(i)}
                                                        style={{
                                                            background: 'rgba(239, 68, 68, 0.2)',
                                                            border: 'none',
                                                            color: 'var(--error)',
                                                            cursor: 'pointer',
                                                            padding: '2px 6px',
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontSize: '0.85rem',
                                                            lineHeight: 1
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                {i < dateRanges.length - 1 && (
                                                    <span style={{
                                                        padding: '3px 8px',
                                                        background: 'rgba(139, 92, 246, 0.2)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        fontSize: '0.65rem',
                                                        color: 'var(--aurora-purple)',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        or
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Results Summary with Filter Toggle */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-lg)',
                padding: '12px 16px',
                background: 'var(--glass-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                        {resultCount > 0 ? (
                            <>
                                Showing <span style={{ color: 'var(--aurora-teal)', fontWeight: 700 }}>{resultCount}</span> quest{resultCount !== 1 ? 's' : ''}
                            </>
                        ) : (
                            'No quests found'
                        )}
                    </p>
                    {activeFilterCount > 0 && (
                        <span style={{
                            padding: '3px 10px',
                            background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-blue))',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: 'white'
                        }}>
                            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        padding: '8px 14px',
                        background: showFilters ? 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-blue))' : 'rgba(255, 255, 255, 0.05)',
                        border: showFilters ? 'none' : '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-full)',
                        color: showFilters ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    🔍 {showFilters ? 'Hide Filters' : 'Filters'}
                </button>
            </div>
        </>
    );
}

export default QuestFilter;
