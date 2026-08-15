import time
import streamlit as st

def initialize_timer_state():
    """Initializes time limit keys in session state."""
    if "enable_time_limits" not in st.session_state:
        st.session_state.enable_time_limits = False
    if "court_timers" not in st.session_state:
        st.session_state.court_timers = {}

def set_court_timer(court_num, duration_minutes):
    """Sets and starts a timer for a specific court."""
    st.session_state.court_timers[court_num] = {
        "start_time": time.time(),
        "duration_seconds": duration_minutes * 60,
        "duration_minutes": duration_minutes,
        "active": True,
        "dismissed": False,
    }

def stop_court_timer(court_num):
    """Stops and clears the timer for a court."""
    if court_num in st.session_state.court_timers:
        st.session_state.court_timers[court_num]["active"] = False

def get_timer_status(court_num):
    """Calculates remaining time or expiration status for a court timer."""
    if court_num not in st.session_state.court_timers:
        return None
    
    timer = st.session_state.court_timers[court_num]
    if not timer.get("active", False):
        return None

    elapsed = time.time() - timer["start_time"]
    remaining = timer["duration_seconds"] - elapsed

    if remaining <= 0:
        return {"expired": True, "remaining": 0}
    return {"expired": False, "remaining": int(remaining)}

def check_expired_timers():
    """Returns court numbers that have active expired timers requiring alerts."""
    expired_courts = []
    if not st.session_state.get("enable_time_limits", False):
        return expired_courts

    for court_num, timer in st.session_state.court_timers.items():
        if timer.get("active", False) and not timer.get("dismissed", False):
            elapsed = time.time() - timer["start_time"]
            if elapsed >= timer["duration_seconds"]:
                expired_courts.append(court_num)

    return expired_courts

def dismiss_timer_alert(court_num):
    """Dismisses the expired alert after notifying the admin."""
    if court_num in st.session_state.court_timers:
        st.session_state.court_timers[court_num]["dismissed"] = True

def reset_all_timers():
    """Stops and clears active timers across all courts."""
    st.session_state.court_timers = {}