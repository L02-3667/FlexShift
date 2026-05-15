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
<<<<<<< HEAD
    fireEvent.press(screen.getByText('Đã đọc và xác nhận'));
=======
    fireEvent.press(screen.getByText('Da doc va xac nhan'));
>>>>>>> b41e4a99ab1041207bc76cbd43deaa053ee6ff1d

    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });
});
