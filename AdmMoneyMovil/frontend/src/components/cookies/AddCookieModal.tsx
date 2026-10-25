import React from 'react';
import { CookieModal, CookieModalProps } from './CookieModal';

export const AddCookieModal: React.FC<CookieModalProps> = (props) => {
  return <CookieModal {...props} />;
};

export default AddCookieModal;
