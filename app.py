import streamlit as st
from streamlit_autorefresh import st_autorefresh
from queue_logic import (
    initialize_queue, 
    clear_queue, 
    update_courts_count, 
    finish_court_match, 
    assign_next_group_to_court
)
from timer_logic import (
    initialize_timer_state,
    set_court_timer,
    stop_court_timer,
    get_timer_status,
    check_expired_timers,
    dismiss_timer_alert,
    reset_all_timers
)

st.set_page_config(page_title="QUEUE UP", page_icon="🏓", layout="wide")

initialize_queue()
initialize_timer_state()

# Initialize session state flag for dialog modal
if "show_clear_dialog" not in st.session_state:
    st.session_state.show_clear_dialog = False

# Auto-refresh UI every 1 second (paused while clear queue dialog is open)
if st.session_state.get("enable_time_limits", False) and not st.session_state.show_clear_dialog:
    st_autorefresh(interval=6000, key="court_timer_refresh")

# --- Sidebar ---
with st.sidebar:
    st.header("Player Check-in")
    name = st.text_input("Player Name")
    skill = st.selectbox("Skill Level", ["Beginner", "Intermediate", "Advanced"])
    number_of_people = st.number_input("Enter number of players", min_value=1, max_value=4, value=1, step=1)

    if st.button("Join Queue", use_container_width=True):
        if name:
            new_entry = {
                "name": name,
                "skill": skill,
                "count": number_of_people,
            }
            st.session_state.queue.append(new_entry)
            st.toast(
                f"Added {name} ({'Solo' if number_of_people == 1 else f'Group of {number_of_people}'}) to queue!",
                icon="✅"
            )
            st.rerun()

# Retrieve current number of courts from session state
if "num_courts" not in st.session_state:
    st.session_state.num_courts = 5

num_courts = st.session_state.num_courts

# --- Main Page Header ---
st.title("QUEUE UP")

# Alert banners for expired timers
expired_courts = check_expired_timers()
for court_num in expired_courts:
    st.error(f"⏰ **TIME'S UP ON COURT {court_num}!** Please go to the court to rotate players.", icon="🚨")

# Top Metric Card
total_waiting_players = sum(entry["count"] for entry in st.session_state.queue)
st.metric(label="Total Players Waiting in Queue", value=total_waiting_players)

st.divider()

# --- Active Courts Section ---
st.header("Active Courts")

court_cols = st.columns(3)

for court_num in range(1, num_courts + 1):
    col_idx = (court_num - 1) % 3
    with court_cols[col_idx]:
        # Card Container to visually group each court's details & actions
        with st.container(border=True):
            st.subheader(f"Court {court_num}")
            court_groups = st.session_state.courts.get(court_num, [])
            
            if court_groups:
                st.caption(f"**Level:** {court_groups[0]['skill']}")
                for idx, group in enumerate(court_groups, start=1):
                    label = "Solo" if group['count'] == 1 else f"Group of {group['count']}"
                    st.write(f"• **{group['name']}** ({label})")
                
                st.write("")
                if st.button(f"Finish Match", key=f"finish_{court_num}", use_container_width=True):
                    stop_court_timer(court_num)
                    finish_court_match(court_num)
                    st.toast(f"Court {court_num} match finished & rotated!", icon="🏓")
                    st.rerun()
            else:
                st.caption("Status: Empty")
                if st.session_state.queue:
                    if st.button(f"Fill Court", key=f"fill_{court_num}", use_container_width=True):
                        assign_next_group_to_court(court_num)
                        st.toast(f"Court {court_num} assigned to next group!", icon="✅")
                        st.rerun()
                else:
                    st.info("Queue is empty.")

            # Timer Controls inside the Card
            if st.session_state.enable_time_limits:
                st.divider()
                timer_info = st.session_state.court_timers.get(court_num, {})
                timer_active = timer_info.get("active", False)

                if not timer_active:
                    col_input, col_start = st.columns([1, 1])
                    with col_input:
                        duration = st.number_input(
                            "Mins", 
                            min_value=1, 
                            max_value=120, 
                            value=15, 
                            step=5, 
                            key=f"input_{court_num}",
                            label_visibility="collapsed"
                        )
                    with col_start:
                        if st.button("Start Timer", key=f"start_{court_num}", use_container_width=True):
                            set_court_timer(court_num, duration)
                            st.toast(f"Timer started for Court {court_num} ({duration}m)", icon="⏳")
                            st.rerun()
                else:
                    status = get_timer_status(court_num)
                    if status:
                        if status["expired"]:
                            st.error("⏰ Time is Up!")
                            if st.button("Clear Alert", key=f"ack_{court_num}", use_container_width=True):
                                dismiss_timer_alert(court_num)
                                stop_court_timer(court_num)
                                st.rerun()
                        else:
                            mins = status["remaining"] // 60
                            secs = status["remaining"] % 60
                            st.info(f"⏳ Remaining: **{mins:02d}:{secs:02d}**")

                        if st.button("Stop Timer", key=f"stop_{court_num}", use_container_width=True):
                            stop_court_timer(court_num)
                            st.toast(f"Timer stopped for Court {court_num}", icon="⏹️")
                            st.rerun()

st.divider()

# --- Categorized Waiting List Section ---
st.header("Full Waiting List by Category")
col_beg, col_int, col_adv = st.columns(3)

beginners = [p for p in st.session_state.queue if p["skill"] == "Beginner"]
intermediates = [p for p in st.session_state.queue if p["skill"] == "Intermediate"]
advanced = [p for p in st.session_state.queue if p["skill"] == "Advanced"]

with col_beg:
    with st.container(border=True):
        st.subheader("🟢 Beginner")
        if beginners:
            for idx, player in enumerate(beginners, start=1):
                st.write(f"{idx}. **{player['name']}** ({player['count']} player{'s' if player['count'] > 1 else ''})")
        else:
            st.caption("No beginners waiting.")

with col_int:
    with st.container(border=True):
        st.subheader("🔵 Intermediate")
        if intermediates:
            for idx, player in enumerate(intermediates, start=1):
                st.write(f"{idx}. **{player['name']}** ({player['count']} player{'s' if player['count'] > 1 else ''})")
        else:
            st.caption("No intermediates waiting.")

with col_adv:
    with st.container(border=True):
        st.subheader("🔴 Advanced")
        if advanced:
            for idx, player in enumerate(advanced, start=1):
                st.write(f"{idx}. **{player['name']}** ({player['count']} player{'s' if player['count'] > 1 else ''})")
        else:
            st.caption("No advanced players waiting.")

st.divider()

# --- Admin Controls ---
st.header("Admin Controls")

with st.container(border=True):
    col_timer, col_courts = st.columns(2)
    
    with col_timer:
        st.subheader("Time Limit Settings")
        master_timer_switch = st.toggle("Enable Time Limits", value=st.session_state.enable_time_limits)
        if master_timer_switch != st.session_state.enable_time_limits:
            st.session_state.enable_time_limits = master_timer_switch
            st.rerun()

    with col_courts:
        st.subheader("Court Settings")
        new_num_courts = st.number_input(
            "Number of Active Courts", 
            min_value=1, 
            max_value=10, 
            value=num_courts, 
            step=1
        )
        if new_num_courts != num_courts:
            st.session_state.num_courts = new_num_courts
            update_courts_count(new_num_courts)
            st.rerun()

    st.divider()

    @st.dialog("Confirm Queue Clear")
    def confirm_clear_dialog():
        st.write("Are you sure you want to clear the entire waiting queue? This action cannot be undone.")
        col1, col2 = st.columns(2)
        with col1:
            if st.button("Yes, Clear Queue", type="primary", use_container_width=True):
                clear_queue()
                st.toast("Queue cleared!", icon="🧹")
                st.rerun()
        with col2:
            if st.button("Cancel", use_container_width=True):
                st.rerun()

    if st.button("Clear Entire Waiting Queue", type="secondary"):
        confirm_clear_dialog()
        reset_all_timers()