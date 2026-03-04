import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Pressable} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.main_container}>
      <View style={styles.profile_header}>
        <View style={styles.profile_box}>
          <IconSymbol name="profile" color={"currentColor"}/>        
        </View>

        <View style={styles.info_container}>
          <Text style={styles.username}>{user?.username ?? 'your profile'}</Text>
          <Text style={styles.texts}>Bio goes here oooh</Text>
          <View style={styles.action_container}>
            {/* Needd to add edit button instead for personal profile view */}
            <Pressable style={styles.action_button}>
              <Text style={styles.button_text}>Follow</Text>
            </Pressable>

            <Pressable style={styles.action_button}>
              <Text  style={styles.button_text}>Pix Me!</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.favorite_container}>
        <View style={styles.sticker_container}>
          <Text style={{textAlign: 'center'}}>Sticker Collection</Text>
          <View style={styles.sticker_box}>
            <View style={styles.sticker}>
              {/* use image here to display the sticker */}
              {/* <Image
                source={{ uri: item.imageUrl }}
              /> */}
            </View>

            <View style={styles.sticker}>
              {/* use image here to display the sticker */}
            </View>
          </View>
        </View>

        <View style={styles.main_color}>
          <View style={styles.color_row}>
            <View style={[
              styles.color_box, 
            { backgroundColor: '#a22d2d' }, // take user info to fill color
            ]}></View>
           <View style={[
              styles.color_box, 
            { backgroundColor: '#a22d2d' }, // take user info to fill color
            ]}></View>

           <View style={[
              styles.color_box, 
            { backgroundColor: '#a22d2d' }, // take user info to fill color
            ]}></View>          
          </View>

          <View style={styles.color_row}>
            <View style={[
              styles.color_box, 
            { backgroundColor: '#a22d2d' }, // take user info to fill color
            ]}></View>
           <View style={[
              styles.color_box, 
            { backgroundColor: '#a22d2d' }, // take user info to fill color
            ]}></View>

           <View style={[
              styles.color_box, 
            { backgroundColor: '#a22d2d' }, // take user info to fill color
            ]}></View>          
          </View>

          <View>
            <Text>Edit tton</Text>
          </View>
        </View>
      </View>

      <View style={styles.book_container}>
        <View style={{height: 300, backgroundColor: '#2b7dc5'}}></View>
      </View>
    </View>
  );
};

      {/* <View style={styles.container}>

      </View> */}

       {/* <Text style={styles.username}>{user?.username ?? 'your profile'}</Text>
      <Text style={styles.email}>{user?.email}</Text> */}
      {/* <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>log out</Text>
      </TouchableOpacity>  */}

const styles = StyleSheet.create({
  main_container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#5174CF'
  },
  profile_header: {
    display: 'flex',
    marginTop: 90,
    flexDirection: 'row',
    paddingLeft: 15,
    paddingRight: 15,
    width: '100%',
  },
  profile_box: {
    height: 92,
    width: 92,
    padding: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  info_container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    marginLeft: 12,
  },
  action_container: {
    display: 'flex',
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  main_color: {
    display: 'flex',
    backgroundColor: '#c03030',
    flexGrow: 1,
    flexDirection: 'row',
  },
  color_row: {
    display: 'flex',
    flexDirection: 'row'
  },
  action_button: {
    display: 'flex',
    justifyContent: 'center',
    height: 33,
    width: '48%',
    fontSize: 15,
    backgroundColor: '#FF004D',
  },
  button_text: {
    width: '100%',
    color: '#ffffff',
    justifyContent: 'center',
    alignContent: 'center',
    textAlign: 'center'
  },
  username: {
    fontSize: 25,
    fontWeight: '700',
    color: '#ffffff',
  },
  texts: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 5,
  },
  favorite_container: {
    display: 'flex',
    width: '80%', 
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center' 
  },
  sticker_container: {
    backgroundColor: '#ff6c6c',
    width: 138
  },
  sticker_box: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  sticker: {
    backgroundColor: '#382979',
    height: 65,
    width: 65,
  },
  color_box: {
    height: 28,
    width: 28,
    backgroundColor: '#a14c67',
  },
  book_container: {
    width: '90%',
    height: '60%'
  },
  email: {
    fontSize: 14,
    color: '#ff6161',
    marginBottom: 40,
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: '#ff6161',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  logoutText: {
    color: '#ff6161',
    fontWeight: '700',
    letterSpacing: 1,
  },

});

export default Profile;