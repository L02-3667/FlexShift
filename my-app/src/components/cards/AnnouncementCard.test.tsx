import { fireEvent, render, screen } from '@testing-library/react-native';

import { AnnouncementCard } from '@/src/components/cards/AnnouncementCard';
import { sampleAnnouncement } from '@/src/test-utils/fixtures';

describe('AnnouncementCard', () => {
  it('renders acknowledgement CTA when required and calls the handler', () => {
    const onAcknowledge = jest.fn();

    render(
      <AnnouncementCard
        item={sampleAnnouncement}
        onAcknowledge={onAcknowledge}
      />,
    );

    expect(screen.getByText(sampleAnnouncement.title)).toBeTruthy();
    fireEvent.press(screen.getByText('Đã đọc và xác nhận'));

    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });
});
