(() => {
  const root = document.getElementById('katbox-discord-widget');
  if (!root) return;

  const guildId = root.dataset.guildId;
  const online = document.getElementById('katbox-discord-online');
  const memberCount = document.getElementById('katbox-discord-member-count');
  const membersRoot = document.getElementById('katbox-discord-members');
  const channelsRoot = document.getElementById('katbox-discord-channels');
  const status = document.getElementById('katbox-discord-status');
  const invite = document.getElementById('katbox-discord-invite');
  const fallbackAvatar = '/1530599699256705095.webp';

  const make = (tag, styles, text) => {
    const element = document.createElement(tag);
    if (styles) Object.assign(element.style, styles);
    if (text !== undefined) element.textContent = text;
    return element;
  };

  function renderMembers(data) {
    const members = Array.isArray(data.members) ? data.members.slice(0, 8) : [];
    membersRoot.replaceChildren();
    memberCount.textContent = members.length ? 'Showing ' + members.length + ' online' : 'No members listed';

    if (!members.length) {
      membersRoot.append(make('p', {
        gridColumn: '1 / -1', margin: '0', padding: '22px 8px',
        textAlign: 'center', color: '#8797ac', fontSize: '11px'
      }, 'No online members are currently listed.'));
      return;
    }

    members.forEach((member) => {
      const card = make('div', {
        minWidth: '0', display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '6px', padding: '9px 3px', borderRadius: '12px',
        background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.045)'
      });
      const avatarWrap = make('div', {
        position: 'relative', width: '38px', height: '38px', flexShrink: '0'
      });
      const avatar = make('img', {
        display: 'block', width: '38px', height: '38px', objectFit: 'cover',
        borderRadius: '50%', background: '#1c293a', border: '1px solid rgba(190,211,235,.18)'
      });
      avatar.src = typeof member.avatar_url === 'string' ? member.avatar_url : fallbackAvatar;
      avatar.alt = '';
      avatar.loading = 'lazy';
      avatar.onerror = () => { avatar.onerror = null; avatar.src = fallbackAvatar; };
      const dot = make('span', {
        position: 'absolute', right: '0', bottom: '0', width: '10px', height: '10px',
        borderRadius: '50%', background: '#8ed6ae', border: '2px solid #111923'
      });
      avatarWrap.append(avatar, dot);
      const name = make('span', {
        display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', color: '#dce5f0', fontSize: '10px', textAlign: 'center'
      }, member.username || 'Community member');
      name.title = member.username || 'Community member';
      card.append(avatarWrap, name);
      membersRoot.append(card);
    });
  }

  function renderChannels(channels) {
    channelsRoot.replaceChildren();
    const publicChannels = Array.isArray(channels) ? channels.slice(0, 3) : [];
    if (!publicChannels.length) {
      channelsRoot.append(make('span', { color: '#8292a7' }, 'No public voice channels are listed.'));
      return;
    }
    publicChannels.forEach((channel) => {
      const row = make('div', {
        display: 'flex', alignItems: 'center', gap: '8px', minWidth: '0',
        padding: '7px 9px', borderRadius: '9px', background: 'rgba(255,255,255,.025)'
      });
      row.append(make('span', { color: '#8ea5bf', fontSize: '13px', lineHeight: '1' }, '⌁'));
      row.append(make('span', {
        minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }, channel.name || 'Voice channel'));
      channelsRoot.append(row);
    });
  }

  async function refresh() {
    try {
      const response = await fetch('https://discord.com/api/guilds/' + encodeURIComponent(guildId) + '/widget.json', {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Discord widget data is unavailable (' + response.status + ').');
      const data = await response.json();
      online.textContent = Number.isFinite(data.presence_count) ? data.presence_count.toLocaleString() : '—';
      renderMembers(data);
      renderChannels(data.channels);
      if (typeof data.instant_invite === 'string' && data.instant_invite.startsWith('https://discord.gg/')) {
        invite.href = data.instant_invite;
      } else if (typeof data.instant_invite === 'string' && data.instant_invite.startsWith('https://discord.com/invite/')) {
        invite.href = data.instant_invite;
      }
      status.textContent = 'Live data from Discord · refreshes automatically';
    } catch (error) {
      status.textContent = 'Discord community data could not load. You can still open the server using the button below.';
      memberCount.textContent = 'Temporarily unavailable';
      channelsRoot.replaceChildren(make('span', { color: '#8292a7' }, 'Community channels are unavailable right now.'));
      console.warn('[KaTBox Discord widget]', error);
    }
  }

  refresh();
  window.setInterval(refresh, 60000);
})();
