export const APP_COPY = {
  common: {
    retry: 'Thử lại',
    backToList: 'Quay lại danh sách',
    signOut: 'Đăng xuất',
    saveFailedTitle: 'Không lưu được cài đặt',
    tryAgain: 'Vui lòng thử lại.',
    noManagerNote: 'Không có ghi chú thêm.',
  },
  bootstrap: {
    loadFailedTitle: 'Không tải được dữ liệu FlexShift',
    loadFailedDescription:
      'Hãy thử nạp lại dữ liệu để tiếp tục khôi phục phiên làm việc và đồng bộ an toàn.',
  },
  navigation: {
    employeeTabs: {
      dashboard: 'Trang chủ',
      calendar: 'Lịch',
      openShifts: 'Ca trống',
      requests: 'Yêu cầu',
      statistics: 'Số liệu',
      settings: 'Cài đặt',
    },
    managerTabs: {
      dashboard: 'Tổng quan',
      calendar: 'Lịch',
      createOpenShift: 'Tạo ca',
      approvals: 'Duyệt',
      statistics: 'Số liệu',
      settings: 'Cài đặt',
    },
  },
  login: {
    heroDescription:
      'Đăng nhập để xem lịch đã chốt, nhận ca phù hợp và theo dõi duyệt ca theo một luồng vận hành rõ ràng hơn.',
    sectionTitle: 'Đăng nhập FlexShift',
    sectionSubtitle:
      'Phiên đăng nhập sẽ được lưu an toàn và tự động khôi phục khi mở app lại.',
    missingCredentials: 'Vui lòng nhập đầy đủ email và mật khẩu.',
    failed: 'Đăng nhập thất bại.',
    bootstrapTitle: 'Không khởi tạo được phiên làm việc',
    devTitle: 'Tài khoản seed cho local dev',
    devDescription:
      'Dùng các tài khoản này sau khi đã chạy Prisma seed để smoke test auth, calendar và approval flow.',
    passwordPlaceholder: 'Nhập mật khẩu',
  },
  syncBanner: {
    title: 'Trạng thái đồng bộ',
    syncing: 'Đang đồng bộ dữ liệu vận hành...',
    offline: 'Đang offline. Thay đổi mới sẽ vào hàng đợi an toàn.',
    ready: 'Sẵn sàng đồng bộ dữ liệu.',
    syncNow: 'Đồng bộ ngay',
    pendingMutationsLabel: 'thay đổi đang chờ gửi',
    pendingAcknowledgementsLabel: 'thông báo cần xác nhận',
  },
  announcements: {
    acknowledged: 'Đã xác nhận',
    requiresAcknowledgement: 'Cần xác nhận',
    informational: 'Thông báo',
    acknowledgeAction: 'Đã đọc và xác nhận',
  },
  requests: {
    requesterLabel: 'Người gửi',
    targetLabel: 'Người nhận ca',
    managerNoteLabel: 'Ghi chú quản lý',
  },
  openShiftDetail: {
    title: 'Chi tiết ca trống',
    subtitle:
      'Xem nhanh thông tin ca và nhận ngay nếu lịch hiện tại không bị chồng chéo.',
    loading: 'Đang tải chi tiết ca...',
    loadFailedTitle: 'Không tải được ca trống',
    missingTitle: 'Không tìm thấy ca trống',
    missingDescription:
      'Ca này có thể đã được nhận hoặc không còn khả dụng nữa.',
    claimedTitle: 'Nhận ca thành công',
    queuedTitle: 'Đã đưa vào hàng đợi',
    claimedDescription: 'Ca trống đã được thêm vào lịch cá nhân của bạn.',
    queuedDescription:
      'Ca trống đã được lưu local và sẽ gửi lên server khi kết nối ổn định.',
    claimFailedTitle: 'Không thể nhận ca',
    rulesTitle: 'Điều kiện nhận ca',
    rules: [
      'Ứng dụng sẽ kiểm tra trùng lịch với các ca đã chốt của bạn trong cùng ngày.',
      'Nếu hợp lệ, ca này sẽ chuyển vào lịch cá nhân để bạn theo dõi cùng các ca khác.',
    ],
    claimAction: 'Nhận ca này',
    unavailableAction: 'Ca này không còn khả dụng',
  },
  leaveRequest: {
    title: 'Tạo đơn xin nghỉ',
    subtitle: 'Chọn ca cần nghỉ và nêu rõ lý do để quản lý duyệt nhanh hơn.',
    loading: 'Đang tải danh sách ca...',
    loadFailedTitle: 'Không tải được ca làm',
    emptyTitle: 'Không còn ca nào để xin nghỉ',
    emptyDescription:
      'Bạn hiện không có ca đã xác nhận hoặc các ca đã có yêu cầu pending.',
    emptyAction: 'Xem yêu cầu của tôi',
    shiftSectionTitle: 'Chọn ca làm',
    reasonLabel: 'Lý do xin nghỉ',
    reasonHint: 'Ví dụ: lịch thi, việc gia đình, sức khỏe...',
    missingShift: 'Vui lòng chọn ca muốn xin nghỉ.',
    sentTitle: 'Đã gửi yêu cầu',
    queuedTitle: 'Đã đưa vào hàng đợi',
    sentDescription: 'Yêu cầu xin nghỉ của bạn đang chờ quản lý duyệt.',
    queuedDescription:
      'Đơn xin nghỉ đã được lưu local và sẽ gửi ngay khi kết nối ổn định.',
    failed: 'Không thể tạo yêu cầu.',
    submitAction: 'Gửi yêu cầu xin nghỉ',
  },
  yieldRequest: {
    title: 'Đề nghị nhường ca',
    subtitle:
      'Chọn ca, đồng nghiệp nhận ca và lý do để quản lý xử lý minh bạch hơn.',
    loading: 'Đang tải dữ liệu nhường ca...',
    loadFailedTitle: 'Không tải được dữ liệu',
    emptyTitle: 'Không còn ca nào để nhường',
    emptyDescription:
      'Bạn cần có ít nhất một ca đã xác nhận thì mới tạo được đề nghị nhường ca.',
    emptyAction: 'Quay lại yêu cầu',
    shiftSectionTitle: 'Chọn ca muốn nhường',
    coworkerSectionTitle: 'Chọn đồng nghiệp nhận ca',
    reasonLabel: 'Lý do nhường ca',
    reasonHint:
      'Ví dụ: trùng lịch học, việc gia đình hoặc không thể đi ca này...',
    missingShift: 'Vui lòng chọn ca muốn nhường.',
    missingCoworker: 'Vui lòng chọn đồng nghiệp nhận ca.',
    sentTitle: 'Đã gửi yêu cầu',
    queuedTitle: 'Đã đưa vào hàng đợi',
    sentDescription: 'Đề nghị nhường ca đang chờ quản lý xem xét.',
    queuedDescription:
      'Đề nghị nhường ca đã được lưu local và sẽ gửi ngay khi có mạng.',
    failed: 'Không thể tạo đề nghị nhường ca.',
    submitAction: 'Gửi đề nghị nhường ca',
  },
  approvals: {
    title: 'Chi tiết yêu cầu',
    subtitle:
      'Xem lý do, ca liên quan và ghi chú xử lý để đưa ra quyết định nhất quán hơn.',
    loading: 'Đang tải chi tiết yêu cầu...',
    loadFailedTitle: 'Không tải được yêu cầu',
    missingTitle: 'Không tìm thấy yêu cầu',
    missingDescription:
      'Yêu cầu này có thể đã được xử lý hoặc không còn khả dụng.',
    detailTitle: 'Thông tin xử lý',
    requesterReasonLabel: 'Lý do từ nhân viên',
    targetEmployeeLabel: 'Người nhận ca dự kiến',
    reviewedAtLabel: 'Đã xử lý lúc',
    managerNoteLabel: 'Ghi chú quản lý',
    managerNoteHint:
      'Ghi chú này sẽ hiển thị lại trong trạng thái yêu cầu để nhân viên dễ theo dõi.',
    approvedTitle: 'Đã duyệt yêu cầu',
    approvedDescription:
      'Lịch làm đã được cập nhật để cả đội theo dõi nhất quán hơn.',
    queuedTitle: 'Đã đưa vào hàng đợi',
    approveQueuedDescription:
      'Quyết định duyệt đã được lưu local và sẽ gửi khi kết nối ổn định.',
    rejectQueuedDescription:
      'Quyết định từ chối đã được lưu local và sẽ gửi khi kết nối ổn định.',
    approveFailedTitle: 'Không thể duyệt yêu cầu',
    rejectTitle: 'Đã từ chối yêu cầu',
    rejectDescription:
      'Trạng thái mới đã hiển thị để nhân viên theo dõi rõ ràng hơn.',
    rejectFailedTitle: 'Không thể từ chối yêu cầu',
    approveAction: 'Duyệt yêu cầu',
    rejectAction: 'Từ chối',
    reviewedTitle: 'Yêu cầu này đã được xử lý.',
    reviewedStatusLabel: 'Trạng thái hiện tại',
    approvedStatus: 'Đã duyệt',
    rejectedStatus: 'Từ chối',
  },
  managerDashboard: {
    title: 'Tổng quan điều phối',
    description:
      'Theo dõi lịch đã chốt, ca đang mở và các yêu cầu phát sinh trong cùng một nhịp quản lý để ra quyết định nhanh hơn.',
    openScheduleAction: 'Mở lịch điều phối',
    createOpenShiftAction: 'Tạo ca trống',
    openApprovalsAction: 'Xem duyệt ca',
    openStatisticsAction: 'Xem số liệu',
    pendingTitle: 'Yêu cầu cần xử lý',
    pendingSubtitle:
      'Ưu tiên các yêu cầu còn chờ để giữ lịch vận hành nhất quán.',
    recentTitle: 'Cập nhật mới nhất',
    recentSubtitle:
      'Giữ nhịp xử lý yêu cầu và thay đổi lịch ở mức nhìn lướt là hiểu.',
    announcementsTitle: 'Thông báo vận hành',
    announcementsSubtitle:
      'Broadcast quan trọng được giữ thành luồng có xác nhận thay vì trôi trong chat.',
    loading: 'Đang tải tổng quan...',
    loadFailedTitle: 'Không tải được tổng quan',
    noPendingTitle: 'Không có yêu cầu đang chờ',
    noPendingDescription:
      'Bạn có thể chuyển sang lịch điều phối hoặc tạo thêm ca để lấp các khoảng trống mới.',
    noUpdatesTitle: 'Chưa có cập nhật mới',
    noUpdatesDescription:
      'Khi lịch thay đổi hoặc yêu cầu được xử lý, mục này sẽ tự động cập nhật.',
    noAnnouncementsTitle: 'Chưa có thông báo mới',
    noAnnouncementsDescription:
      'Thông báo broadcast và cập nhật cần xác nhận sẽ hiển thị ở đây.',
    acknowledgeSentTitle: 'Đã xác nhận thông báo',
    acknowledgeQueuedTitle: 'Đã đưa vào hàng đợi',
    acknowledgeSentDescription: 'Trạng thái xác nhận đã được đồng bộ.',
    acknowledgeQueuedDescription:
      'Trạng thái xác nhận sẽ tự động gửi khi kết nối ổn định.',
    acknowledgeFailedTitle: 'Không thể xác nhận',
  },
  settings: {
    loading: 'Đang tải cài đặt của bạn...',
    loadFailedTitle: 'Không tải được cài đặt',
    notificationsGroup: 'Thông báo',
    remindersGroup: 'Nhắc lịch',
    appearanceGroup: 'Giao diện',
    supportGroup: 'Hỗ trợ',
    notificationsEnabledTitle: 'Nhận cập nhật mới',
    notificationsEnabledDescription:
      'Báo thay đổi lịch, duyệt yêu cầu và phân công mới.',
    approvalUpdatesTitle: 'Thông báo duyệt yêu cầu',
    approvalUpdatesDescription:
      'Ưu tiên cập nhật khi yêu cầu xin nghỉ hoặc nhường ca được xử lý.',
    openShiftAlertsTitle: 'Thông báo ca phù hợp',
    openShiftAlertsDescription:
      'Nhắc khi có ca trống mới phù hợp với lịch làm của bạn.',
    remindersEnabledTitle: 'Nhắc trước ca làm',
    remindersEnabledDescription:
      'Giữ ứng dụng chủ động nhắc lịch trước giờ bắt đầu ca.',
    languageLabel: 'Ngôn ngữ',
    themeLabel: 'Chế độ hiển thị',
    languageVietnamese: 'Tiếng Việt',
    themeSystem: 'Theo hệ thống',
    themeLight: 'Sáng',
    contactLabel: 'Liên hệ',
    privacyLabel: 'Quyền riêng tư',
    privacyValue: 'Chính sách bảo mật và điều khoản sử dụng',
    versionLabel: 'Phiên bản ứng dụng',
    updatedAtLabel: 'Lưu gần nhất',
    updatedJustNow: 'Vừa cập nhật',
  },
} as const;
