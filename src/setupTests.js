import { configure } from 'enzyme';
import 'jest-canvas-mock';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });
