export const APP_COPY = {
  common: {
    retry: 'Thu lai',
    backToList: 'Quay lai danh sach',
    signOut: 'Dang xuat',
    saveFailedTitle: 'Khong luu duoc cai dat',
    tryAgain: 'Vui long thu lai.',
    noManagerNote: 'Khong co ghi chu them.',
  },
  bootstrap: {
    loadFailedTitle: 'Khong tai duoc du lieu FlexShift',
    loadFailedDescription:
      'Hay thu nap lai du lieu de tiep tuc khoi phuc phien lam viec va dong bo an toan.',
  },
  navigation: {
    employeeTabs: {
      dashboard: 'Trang chu',
      calendar: 'Lich',
      openShifts: 'Ca trong',
      requests: 'Yeu cau',
      statistics: 'So lieu',
      settings: 'Cai dat',
    },
    managerTabs: {
      dashboard: 'Tong quan',
      calendar: 'Lich',
      createOpenShift: 'Tao ca',
      approvals: 'Duyet',
      statistics: 'So lieu',
      settings: 'Cai dat',
    },
  },
  login: {
    heroDescription:
      'Dang nhap de xem lich da chot, nhan ca phu hop va theo doi duyet ca theo mot luong van hanh ro rang hon.',
    sectionTitle: 'Dang nhap FlexShift',
    sectionSubtitle:
      'Phien dang nhap se duoc luu an toan va tu dong khoi phuc khi mo app lai.',
    missingCredentials: 'Vui long nhap day du email va mat khau.',
    failed: 'Dang nhap that bai.',
    bootstrapTitle: 'Khong khoi tao duoc phien lam viec',
    devTitle: 'Tai khoan seed cho local dev',
    devDescription:
      'Dung cac tai khoan nay sau khi da chay Prisma seed de smoke test auth, calendar va approval flow.',
    passwordPlaceholder: 'Nhap mat khau',
  },
  syncBanner: {
    title: 'Trang thai dong bo',
    syncing: 'Dang dong bo du lieu van hanh...',
    offline: 'Dang offline. Thay doi moi se vao hang doi an toan.',
    ready: 'San sang dong bo du lieu.',
    syncNow: 'Dong bo ngay',
    pendingMutationsLabel: 'thay doi dang cho gui',
    pendingAcknowledgementsLabel: 'thong bao can xac nhan',
  },
  announcements: {
    acknowledged: 'Da xac nhan',
    requiresAcknowledgement: 'Can xac nhan',
    informational: 'Thong bao',
    acknowledgeAction: 'Da doc va xac nhan',
  },
  requests: {
    requesterLabel: 'Nguoi gui',
    targetLabel: 'Nguoi nhan ca',
    managerNoteLabel: 'Ghi chu quan ly',
  },
  openShiftDetail: {
    title: 'Chi tiet ca trong',
    subtitle:
      'Xem nhanh thong tin ca va nhan ngay neu lich hien tai khong bi chong cheo.',
    loading: 'Dang tai chi tiet ca...',
    loadFailedTitle: 'Khong tai duoc ca trong',
    missingTitle: 'Khong tim thay ca trong',
    missingDescription:
      'Ca nay co the da duoc nhan hoac khong con kha dung nua.',
    claimedTitle: 'Nhan ca thanh cong',
    queuedTitle: 'Da dua vao hang doi',
    claimedDescription: 'Ca trong da duoc them vao lich ca nhan cua ban.',
    queuedDescription:
      'Ca trong da duoc luu local va se gui len server khi ket noi on dinh.',
    claimFailedTitle: 'Khong the nhan ca',
    rulesTitle: 'Dieu kien nhan ca',
    rules: [
      'Ung dung se kiem tra trung lich voi cac ca da chot cua ban trong cung ngay.',
      'Neu hop le, ca nay se chuyen vao lich ca nhan de ban theo doi cung cac ca khac.',
    ],
    claimAction: 'Nhan ca nay',
    unavailableAction: 'Ca nay khong con kha dung',
  },
  leaveRequest: {
    title: 'Tao don xin nghi',
    subtitle: 'Chon ca can nghi va neu ro ly do de quan ly duyet nhanh hon.',
    loading: 'Dang tai danh sach ca...',
    loadFailedTitle: 'Khong tai duoc ca lam',
    emptyTitle: 'Khong con ca nao de xin nghi',
    emptyDescription:
      'Ban hien khong co ca da xac nhan hoac cac ca da co yeu cau pending.',
    emptyAction: 'Xem yeu cau cua toi',
    shiftSectionTitle: 'Chon ca lam',
    reasonLabel: 'Ly do xin nghi',
    reasonHint: 'Vi du: lich thi, viec gia dinh, suc khoe...',
    missingShift: 'Vui long chon ca muon xin nghi.',
    sentTitle: 'Da gui yeu cau',
    queuedTitle: 'Da dua vao hang doi',
    sentDescription: 'Yeu cau xin nghi cua ban dang cho quan ly duyet.',
    queuedDescription:
      'Don xin nghi da duoc luu local va se gui ngay khi ket noi on dinh.',
    failed: 'Khong the tao yeu cau.',
    submitAction: 'Gui yeu cau xin nghi',
  },
  yieldRequest: {
    title: 'De nghi nhuong ca',
    subtitle:
      'Chon ca, dong nghiep nhan ca va ly do de quan ly xu ly minh bach hon.',
    loading: 'Dang tai du lieu nhuong ca...',
    loadFailedTitle: 'Khong tai duoc du lieu',
    emptyTitle: 'Khong con ca nao de nhuong',
    emptyDescription:
      'Ban can co it nhat mot ca da xac nhan thi moi tao duoc de nghi nhuong ca.',
    emptyAction: 'Quay lai yeu cau',
    shiftSectionTitle: 'Chon ca muon nhuong',
    coworkerSectionTitle: 'Chon dong nghiep nhan ca',
    reasonLabel: 'Ly do nhuong ca',
    reasonHint:
      'Vi du: trung lich hoc, viec gia dinh hoac khong the di ca nay...',
    missingShift: 'Vui long chon ca muon nhuong.',
    missingCoworker: 'Vui long chon dong nghiep nhan ca.',
    sentTitle: 'Da gui yeu cau',
    queuedTitle: 'Da dua vao hang doi',
    sentDescription: 'De nghi nhuong ca dang cho quan ly xem xet.',
    queuedDescription:
      'De nghi nhuong ca da duoc luu local va se gui ngay khi co mang.',
    failed: 'Khong the tao de nghi nhuong ca.',
    submitAction: 'Gui de nghi nhuong ca',
  },
  approvals: {
    title: 'Chi tiet yeu cau',
    subtitle:
      'Xem ly do, ca lien quan va ghi chu xu ly de dua ra quyet dinh nhat quan hon.',
    loading: 'Dang tai chi tiet yeu cau...',
    loadFailedTitle: 'Khong tai duoc yeu cau',
    missingTitle: 'Khong tim thay yeu cau',
    missingDescription:
      'Yeu cau nay co the da duoc xu ly hoac khong con kha dung.',
    detailTitle: 'Thong tin xu ly',
    requesterReasonLabel: 'Ly do tu nhan vien',
    targetEmployeeLabel: 'Nguoi nhan ca du kien',
    reviewedAtLabel: 'Da xu ly luc',
    managerNoteLabel: 'Ghi chu quan ly',
    managerNoteHint:
      'Ghi chu nay se hien thi lai trong trang thai yeu cau de nhan vien de theo doi.',
    approvedTitle: 'Da duyet yeu cau',
    approvedDescription:
      'Lich lam da duoc cap nhat de ca doi theo doi nhat quan hon.',
    queuedTitle: 'Da dua vao hang doi',
    approveQueuedDescription:
      'Quyet dinh duyet da duoc luu local va se gui khi ket noi on dinh.',
    rejectQueuedDescription:
      'Quyet dinh tu choi da duoc luu local va se gui khi ket noi on dinh.',
    approveFailedTitle: 'Khong the duyet yeu cau',
    rejectTitle: 'Da tu choi yeu cau',
    rejectDescription:
      'Trang thai moi da hien thi de nhan vien theo doi ro rang hon.',
    rejectFailedTitle: 'Khong the tu choi yeu cau',
    approveAction: 'Duyet yeu cau',
    rejectAction: 'Tu choi',
    reviewedTitle: 'Yeu cau nay da duoc xu ly.',
    reviewedStatusLabel: 'Trang thai hien tai',
    approvedStatus: 'Da duyet',
    rejectedStatus: 'Tu choi',
  },
  managerDashboard: {
    title: 'Tong quan dieu phoi',
    description:
      'Theo doi lich da chot, ca dang mo va cac yeu cau phat sinh trong cung mot nhip quan ly de ra quyet dinh nhanh hon.',
    openScheduleAction: 'Mo lich dieu phoi',
    createOpenShiftAction: 'Tao ca trong',
    openApprovalsAction: 'Xem duyet ca',
    openStatisticsAction: 'Xem so lieu',
    pendingTitle: 'Yeu cau can xu ly',
    pendingSubtitle:
      'Uu tien cac yeu cau con cho de giu lich van hanh nhat quan.',
    recentTitle: 'Cap nhat moi nhat',
    recentSubtitle:
      'Giu nhip xu ly yeu cau va thay doi lich o muc nhin luot la hieu.',
    announcementsTitle: 'Thong bao van hanh',
    announcementsSubtitle:
      'Broadcast quan trong duoc giu thanh luong co xac nhan thay vi troi trong chat.',
    loading: 'Dang tai tong quan...',
    loadFailedTitle: 'Khong tai duoc tong quan',
    noPendingTitle: 'Khong co yeu cau dang cho',
    noPendingDescription:
      'Ban co the chuyen sang lich dieu phoi hoac tao them ca de lap cac khoang trong moi.',
    noUpdatesTitle: 'Chua co cap nhat moi',
    noUpdatesDescription:
      'Khi lich thay doi hoac yeu cau duoc xu ly, muc nay se tu dong cap nhat.',
    noAnnouncementsTitle: 'Chua co thong bao moi',
    noAnnouncementsDescription:
      'Thong bao broadcast va cap nhat can xac nhan se hien thi o day.',
    acknowledgeSentTitle: 'Da xac nhan thong bao',
    acknowledgeQueuedTitle: 'Da dua vao hang doi',
    acknowledgeSentDescription: 'Trang thai xac nhan da duoc dong bo.',
    acknowledgeQueuedDescription:
      'Trang thai xac nhan se tu dong gui khi ket noi on dinh.',
    acknowledgeFailedTitle: 'Khong the xac nhan',
  },
  settings: {
    loading: 'Dang tai cai dat cua ban...',
    loadFailedTitle: 'Khong tai duoc cai dat',
    notificationsGroup: 'Thong bao',
    remindersGroup: 'Nhac lich',
    appearanceGroup: 'Giao dien',
    supportGroup: 'Ho tro',
    notificationsEnabledTitle: 'Nhan cap nhat moi',
    notificationsEnabledDescription:
      'Bao thay doi lich, duyet yeu cau va phan cong moi.',
    approvalUpdatesTitle: 'Thong bao duyet yeu cau',
    approvalUpdatesDescription:
      'Uu tien cap nhat khi yeu cau xin nghi hoac nhuong ca duoc xu ly.',
    openShiftAlertsTitle: 'Thong bao ca phu hop',
    openShiftAlertsDescription:
      'Nhac khi co ca trong moi phu hop voi lich lam cua ban.',
    remindersEnabledTitle: 'Nhac truoc ca lam',
    remindersEnabledDescription:
      'Giu ung dung chu dong nhac lich truoc gio bat dau ca.',
    languageLabel: 'Ngon ngu',
    themeLabel: 'Che do hien thi',
    languageVietnamese: 'Tieng Viet',
    themeSystem: 'Theo he thong',
    themeLight: 'Sang',
    contactLabel: 'Lien he',
    privacyLabel: 'Quyen rieng tu',
    privacyValue: 'Chinh sach bao mat va dieu khoan su dung',
    versionLabel: 'Phien ban ung dung',
    updatedAtLabel: 'Luu gan nhat',
    updatedJustNow: 'Vua cap nhat',
  },
} as const;
