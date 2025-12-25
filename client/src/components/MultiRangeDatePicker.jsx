import { useState, useRef, useEffect } from 'react';

/**
 * Multi-Range Date Picker Component
 * Allows selecting multiple date ranges via calendar
 * Each range is created by clicking start date then end date
 */
function MultiRangeDatePicker({ ranges = [], onChange, dateField = 'deadline' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectionStart, setSelectionStart] = useState(null);
    const [pendingRanges, setPendingRanges] = useState(ranges);
    const [hoverDate, setHoverDate] = useState(null);
    const containerRef = useRef(null);

    // Sync pending ranges with prop changes
    useEffect(() => {
        setPendingRanges(ranges);
    }, [ranges]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days = [];

        // Previous month days
        const prevMonthDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
        const prevMonth = new Date(year, month, 0);
        for (let i = prevMonthDays - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonth.getDate() - i),
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Next month days to fill grid
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }

        return days;
    };

    const formatDate = (date) => {
        // Use local date format to avoid timezone issues with toISOString (which uses UTC)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const normalizeDate = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    };

    const isDateInRange = (date, range) => {
        const d = normalizeDate(date);
        const from = normalizeDate(range.from);
        const to = normalizeDate(range.to);
        return d >= from && d <= to;
    };

    const isDateSelected = (date) => {
        return pendingRanges.some(r => isDateInRange(date, r));
    };

    const isDateInPendingSelection = (date) => {
        if (!selectionStart || !hoverDate) return false;
        const d = normalizeDate(date);
        const start = normalizeDate(selectionStart);
        const end = normalizeDate(hoverDate);
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        return d >= min && d <= max;
    };

    const isRangeStart = (date) => {
        return pendingRanges.some(r => formatDate(new Date(r.from)) === formatDate(new Date(date)));
    };

    const isRangeEnd = (date) => {
        return pendingRanges.some(r => formatDate(new Date(r.to)) === formatDate(new Date(date)));
    };

    const handleDateClick = (date) => {
        const dateStr = formatDate(date);

        if (!selectionStart) {
            // First click - set start
            setSelectionStart(dateStr);
        } else {
            // Second click - create range
            const start = selectionStart;
            const end = dateStr;

            // Ensure from <= to
            const from = start <= end ? start : end;
            const to = start <= end ? end : start;

            setPendingRanges([...pendingRanges, { from, to }]);
            setSelectionStart(null);
            setHoverDate(null);
        }
    };

    const removeRange = (index) => {
        const newRanges = pendingRanges.filter((_, i) => i !== index);
        setPendingRanges(newRanges);
    };

    const clearAll = () => {
        setPendingRanges([]);
        setSelectionStart(null);
    };

    const applyFilters = () => {
        onChange(pendingRanges);
        setIsOpen(false);
    };

    const cancelSelection = () => {
        setPendingRanges(ranges);
        setSelectionStart(null);
        setIsOpen(false);
    };

    const closeModal = () => {
        setIsOpen(false);
        setSelectionStart(null);
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const days = getDaysInMonth(currentMonth);
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '10px 16px',
                    background: ranges.length > 0
                        ? 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-blue))'
                        : 'rgba(255, 255, 255, 0.03)',
                    border: ranges.length > 0 ? 'none' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: ranges.length > 0 ? 'white' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                📅 {ranges.length > 0 ? `${ranges.length} Range${ranges.length > 1 ? 's' : ''} Selected` : 'Select Date Ranges'}
                <span style={{ fontSize: '0.8rem' }}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {/* Calendar Modal */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 9998,
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(2px)'
                        }}
                        onClick={closeModal}
                    />

                    {/* Calendar */}
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 9999,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
                        padding: '20px',
                        minWidth: '360px',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <button
                                onClick={prevMonth}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    padding: '8px 12px',
                                    borderRadius: 'var(--radius-sm)'
                                }}
                            >
                                ←
                            </button>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <button
                                onClick={nextMonth}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    padding: '8px 12px',
                                    borderRadius: 'var(--radius-sm)'
                                }}
                            >
                                →
                            </button>
                        </div>

                        {/* Selection Hint */}
                        <div style={{
                            padding: '10px 14px',
                            background: selectionStart ? 'rgba(0, 255, 204, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '16px',
                            fontSize: '0.85rem',
                            color: selectionStart ? 'var(--aurora-teal)' : 'var(--text-muted)',
                            textAlign: 'center',
                            border: selectionStart ? '1px solid rgba(0, 255, 204, 0.2)' : '1px solid transparent'
                        }}>
                            {selectionStart
                                ? `📍 Start: ${formatDisplayDate(selectionStart)} — Now click end date`
                                : '👆 Click a date to start selecting a range'}
                        </div>

                        {/* Week Days Header */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '2px',
                            marginBottom: '8px'
                        }}>
                            {weekDays.map(day => (
                                <div key={day} style={{
                                    textAlign: 'center',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    padding: '6px',
                                    fontWeight: 600
                                }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '2px'
                        }}>
                            {days.map(({ date, isCurrentMonth }, i) => {
                                const dateStr = formatDate(new Date(date));
                                const isToday = normalizeDate(date) === today.getTime();
                                const isSelected = isDateSelected(date);
                                const isPending = isDateInPendingSelection(date);
                                const isStart = isRangeStart(date) || (selectionStart && dateStr === selectionStart);
                                const isEnd = isRangeEnd(date);

                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleDateClick(new Date(date))}
                                        onMouseEnter={() => selectionStart && setHoverDate(dateStr)}
                                        style={{
                                            padding: '10px 6px',
                                            background: isSelected
                                                ? 'rgba(0, 255, 204, 0.25)'
                                                : isPending
                                                    ? 'rgba(139, 92, 246, 0.2)'
                                                    : 'transparent',
                                            border: isToday
                                                ? '2px solid var(--aurora-teal)'
                                                : '1px solid transparent',
                                            borderRadius: isStart && isEnd ? 'var(--radius-sm)'
                                                : isStart ? 'var(--radius-sm) 0 0 var(--radius-sm)'
                                                    : isEnd ? '0 var(--radius-sm) var(--radius-sm) 0'
                                                        : '0',
                                            color: !isCurrentMonth
                                                ? 'var(--text-muted)'
                                                : isSelected || isPending
                                                    ? 'var(--aurora-teal)'
                                                    : 'var(--text-primary)',
                                            fontWeight: isSelected || isToday ? 700 : 400,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            opacity: isCurrentMonth ? 1 : 0.3,
                                            transition: 'all 0.1s ease'
                                        }}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Selected Ranges */}
                        {pendingRanges.length > 0 && (
                            <div style={{
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '1px solid var(--glass-border)'
                            }}>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-muted)',
                                    marginBottom: '10px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>📌 Selected Ranges ({pendingRanges.length})</span>
                                    <button
                                        onClick={clearAll}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            color: 'var(--error)',
                                            cursor: 'pointer',
                                            fontSize: '0.7rem',
                                            padding: '4px 8px',
                                            borderRadius: 'var(--radius-sm)'
                                        }}
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {pendingRanges.map((range, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                padding: '6px 10px',
                                                background: 'rgba(0, 255, 204, 0.1)',
                                                border: '1px solid rgba(0, 255, 204, 0.25)',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: '0.8rem',
                                                color: 'var(--aurora-teal)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <span style={{ fontWeight: 600 }}>{formatDisplayDate(range.from)}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                                            <span style={{ fontWeight: 600 }}>{formatDisplayDate(range.to)}</span>
                                            <button
                                                onClick={() => removeRange(i)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--aurora-teal)',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    fontSize: '1.1rem',
                                                    lineHeight: 1
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            marginTop: '20px',
                            paddingTop: '16px',
                            borderTop: '1px solid var(--glass-border)'
                        }}>
                            <button
                                onClick={cancelSelection}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.9rem'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={applyFilters}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'linear-gradient(135deg, var(--aurora-teal), var(--aurora-blue))',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.9rem'
                                }}
                            >
                                ✓ Apply Filter
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default MultiRangeDatePicker;
