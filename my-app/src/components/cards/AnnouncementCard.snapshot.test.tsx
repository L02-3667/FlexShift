import { render } from '@testing-library/react-native';

import { AnnouncementCard } from '@/src/components/cards/AnnouncementCard';
import { sampleAnnouncement } from '@/src/test-utils/fixtures';

describe('AnnouncementCard snapshot', () => {
  it('matches the stable card snapshot', () => {
    const { toJSON } = render(<AnnouncementCard item={sampleAnnouncement} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
