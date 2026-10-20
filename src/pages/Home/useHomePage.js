import { useState, useEffect, useCallback } from 'react';
import { message, Modal } from 'antd';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Headless hook containing data loading, shelf (rak) retrieval,
 * draft session inspection, and routine indent startup logic.
 */
export const useHomePage = () => {
    const { profile, user } = useAuth();
    const navigate = useNavigate();
    const unit = profile?.main_unit || user?.main_unit || 'OPD';

    const [raks, setRaks] = useState([]);
    const [loadingRaks, setLoadingRaks] = useState(true);
    const [selectedRak, setSelectedRak] = useState(null);
    const [draftSession, setDraftSession] = useState(null);

    const fetchRaks = useCallback(async () => {
        try {
            setLoadingRaks(true);
            const data = await api.get(`/inventory/raks?main_unit=${encodeURIComponent(unit)}`);
            const rakList = data.map(item => item.row);
            setRaks(rakList);
            if (rakList.length > 0 && !selectedRak) {
                setSelectedRak(rakList[0]);
            }
        } catch (error) {
            console.error("Error fetching raks", error);
            message.error("Failed to load Raks");
        } finally {
            setLoadingRaks(false);
        }
    }, [unit, selectedRak]);

    const checkDraftSession = useCallback(async () => {
        try {
            const draft = await api.get('/indent_sessions/draft?session_type=Routine');
            setDraftSession(draft || null);
        } catch (err) {
            console.error("Error checking draft session", err);
        }
    }, []);

    useEffect(() => {
        fetchRaks();
        checkDraftSession();
    }, [fetchRaks, checkDraftSession]);

    const handleStartRoutine = async (rakValue) => {
        const targetRak = typeof rakValue === 'object' ? rakValue?.rak : rakValue;

        if (!targetRak) {
            message.warning("Select a RAK first!");
            return;
        }

        try {
            const currentDraft = await api.get('/indent_sessions/draft?session_type=Routine');

            if (currentDraft) {
                // If the draft is for the same Rak, navigate directly to resume
                if (currentDraft.rak === targetRak) {
                    navigate(`/routine-indent?rak=${encodeURIComponent(targetRak)}`);
                    return;
                }

                // If for a different Rak, confirm discarding
                Modal.confirm({
                    title: 'Existing Draft Found',
                    content: `You have an active draft for Rak ${currentDraft.rak}. Do you want to start a new routine indent for Rak ${targetRak}? The previous draft will be discarded.`,
                    onOk: async () => {
                        try {
                            await api.delete('/indent_sessions/drafts/cleanup?session_type=Routine');
                            navigate(`/routine-indent?rak=${encodeURIComponent(targetRak)}`);
                        } catch (err) {
                            console.error(err);
                            message.error('Failed to discard previous draft');
                        }
                    }
                });
                return;
            }
        } catch (err) {
            console.error(err);
        }

        navigate(`/routine-indent?rak=${encodeURIComponent(targetRak)}`);
    };

    return {
        unit,
        user,
        profile,
        raks,
        loadingRaks,
        selectedRak,
        setSelectedRak,
        draftSession,
        handleStartRoutine,
        navigate
    };
};

export default useHomePage;
